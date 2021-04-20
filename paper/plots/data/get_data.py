from typing import Callable, Dict, Any, List, Literal, Optional, Tuple, Union
import matplotlib.pyplot as plt
import pandas as pd
import json
import os

from figures.fig_config import get_sns

DEFAULT_DATABASE_NAME = "database"


class DatasetStats:
    min: float
    max: float
    avg: float
    total: float
    median: float
    stddev: float

    def __init__(self, data_obj: Dict[str, float]):
        self.min = data_obj["min"]
        self.max = data_obj["max"]
        self.avg = data_obj["avg"]
        self.total = data_obj["total"]
        self.median = data_obj["median"]
        self.stddev = data_obj["stddev"]


class ByComponentNumberStats:
    component_time_map: Dict[str, float]
    stats: DatasetStats

    def __init__(self, data_obj: Dict[str, Any]):
        self.component_time_map = data_obj["components"]
        self.stats = DatasetStats(data_obj["stats"])


class TimesAndStats:
    times: List[float]
    stats: DatasetStats

    def __init__(self, data_obj: Dict[str, Any]):
        self.times = data_obj["times"]
        self.stats = DatasetStats(data_obj["stats"])


class TimeData:
    values: List[float]

    def __init__(self, data_obj: Dict[str, Any]):
        self.values = data_obj["values"] if "values" in data_obj else data_obj["times"]
        self.stats = DatasetStats(data_obj["stats"])


class RenderTime:
    component_time_map: Dict[str, Dict[int, ByComponentNumberStats]]
    stats_by_num_components: Dict[str, float]

    def __init__(self, data_obj: Dict[str, Any]):
        self.component_time_map = {}
        for component_name in data_obj["components"]:
            self.component_time_map[component_name] = {}
            component_time_data = data_obj["components"][component_name]
            for number in component_time_data:
                self.component_time_map[component_name][number] = TimesAndStats(component_time_data[number])

        for number in data_obj["stats"]:
            self.stats_by_num_components = DatasetStats(data_obj["stats"][number])


class PageLoadTime:
    first_paint: TimeData
    first_contentful_paint: TimeData

    def __init__(self, data_obj: Dict[str, Any]):
        self.first_paint = TimeData(data_obj["first-paint"])
        self.first_contentful_paint = TimeData(data_obj["first-contentful-paint"])


class BundleData:
    framework: str
    bundle: str

    is_css_framework: bool
    lines_of_code: ByComponentNumberStats
    cyclomatic_complexity: ByComponentNumberStats
    maintainability: ByComponentNumberStats
    structural_complexity: ByComponentNumberStats
    size: int
    number_of_components: int
    load_time: TimeData
    render_time: RenderTime
    page_load_time: Optional[PageLoadTime]

    def __init__(self, data_obj: Dict[str, Any], framework: str, bundle: str):
        self.framework = framework
        self.bundle = bundle

        self.is_css_framework = data_obj["is-css-framework"]
        self.lines_of_code = ByComponentNumberStats(data_obj["lines-of-code"])
        self.cyclomatic_complexity = ByComponentNumberStats(data_obj["cyclomatic-complexity"])
        self.maintainability = ByComponentNumberStats(data_obj["maintainability"])
        self.structural_complexity = ByComponentNumberStats(data_obj["structural-complexity"])
        self.size = data_obj["size"]
        self.load_time = TimeData(data_obj["load-time"])
        self.number_of_components = data_obj["number-of-components"]
        self.render_time = RenderTime(data_obj["render-time"])
        if "page-load-time" in data_obj:
            self.page_load_time = PageLoadTime(data_obj["page-load-time"])
        else:
            self.page_load_time = None


class FrameworkData:
    _bundles: Dict[str, BundleData]
    _bundle_list: List[BundleData]

    framework: str

    def __init__(self, data_obj: Dict[str, Any], framework: str):
        self.framework = framework

        self._bundles = {}
        self._bundle_list = []
        for bundle in data_obj:
            bundle_data = BundleData(data_obj[bundle], framework, bundle)
            self._bundles[bundle] = bundle_data
            self._bundle_list.append(bundle_data)

    def get_data_for_bundle(self, bundle: str) -> Optional[BundleData]:
        return self._bundles[bundle]

    def iter_bundles(self) -> List[BundleData]:
        return self._bundle_list


class Data:
    _frameworks: Dict[str, FrameworkData]
    _framework_list: List[FrameworkData]

    def __init__(self, data_obj: Dict[str, Any]):
        self._frameworks = {}
        self._framework_list = []
        for framework in data_obj:
            framework_data = FrameworkData(data_obj[framework], framework)
            self._frameworks[framework] = framework_data
            self._framework_list.append(framework_data)

    def get_data_for_framework(self, framework: str) -> Optional[FrameworkData]:
        return self._frameworks[framework]

    def get_data_for_bundle(self, bundle: str) -> Optional[BundleData]:
        for framework_data in self._framework_list:
            if framework_data.get_data_for_bundle(bundle) != None:
                return framework_data.get_data_for_bundle(bundle)
        return None

    def iter_frameworks(self) -> List[FrameworkData]:
        return self._framework_list

    def iter_bundles(self) -> List[BundleData]:
        bundles: List[BundleData] = []
        for framework in self._framework_list:
            bundles = bundles + framework.iter_bundles()
        return bundles


def create_dataframe(
    data: Data, get_data: Callable[[BundleData], Any], bundle_label: str, data_label: str, framework_label: str
) -> pd.DataFrame:
    obj = {bundle_label: [], data_label: [], framework_label: []}
    for bundle in data.iter_bundles():
        data = get_data(bundle)
        if data == None:
            continue
        data_list = data if type(data) == list else [data]
        for data_part in data_list:
            obj[bundle_label].append(bundle.bundle)
            obj[framework_label].append(bundle.framework)
            obj[data_label].append(data_part)

    return pd.DataFrame(obj)


def create_plot(
    plot_type: Union[Literal["boxen"], Literal["scatter"]],
    data: Data,
    get_data: Callable[[BundleData], Any],
    bundle_label: str,
    data_label: str,
    framework_label: str = "framework",
    rotate_labels: bool = False,
    rotation: int = 90,
    figsize: Optional[Tuple[int, int]] = None,
    extra: List[Any] = [],
    extra_dict: Dict[str, Any] = {},
    data_frame: Optional[Any] = None,
    dodge: bool = False
) -> pd.DataFrame:
    sns = get_sns()
    df = data_frame if data_frame is not None else create_dataframe(data, get_data, bundle_label, data_label, framework_label)
    if figsize:
        plt.figure(figsize=figsize)
    if rotate_labels:
        plt.xticks(rotation=rotation)
    else:
        plt.xticks(rotation=0)
    if plot_type == "boxen":
        ax = sns.boxenplot(x=bundle_label, y=data_label, data=df, *extra, **extra_dict, dodge=dodge)
    elif plot_type == "boxen-dots":
        ax = sns.boxenplot(x=bundle_label, y=data_label, data=df, *extra, **extra_dict, showfliers=False, dodge=dodge)
        ax = sns.stripplot(x=bundle_label, y=data_label, data=df, size=2, color=".26")
    elif plot_type == "scatter":
        ax = sns.scatterplot(x=bundle_label, y=data_label, data=df, *extra, hue="framework")
    else:
        raise Exception(f'Unknown plot type "{plot_type}"')
    plt.tight_layout()
    return ax


def get_data(database_name: str = DEFAULT_DATABASE_NAME) -> Data:
    current_dir = os.path.dirname(os.path.realpath(__file__))
    file_path = os.path.join(current_dir, f"../../../metrics/data/{database_name}.json")

    json_content: Dict[str, Any]
    with open(file_path, "r") as json_file:
        json_content = json.load(json_file)

    return Data(json_content["metrics"])