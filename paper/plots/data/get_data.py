from typing import Callable, Dict, Any, List, Literal, Optional, Tuple, Union
import matplotlib.pyplot as plt
import pandas as pd
import json
import os

from figures.fig_config import get_sns
from data.print_data import print_data

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
    component_time_map: Dict[str, Dict[int, TimesAndStats]]
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

    @staticmethod
    def find_in_arr(arr: List[Any], finder: Callable[[Any], bool]) -> Optional[Any]:
        for item in arr:
            if finder(item):
                return item
        return None

    def __init__(self, data_obj: Dict[str, Any], framework: str):
        self.framework = framework

        self._bundles = {}
        self._bundle_list = []

        def add_bundle_to_lists(bundle: str):
            bundle_data = BundleData(data_obj[bundle], framework, bundle)
            self._bundles[bundle] = bundle_data
            self._bundle_list.append(bundle_data)

        if "cow-components" in framework:
            dashboard_key = self.find_in_arr(data_obj.keys(), lambda key: "dashboard" in key)
            if dashboard_key:
                add_bundle_to_lists(dashboard_key)
            add_bundle_to_lists(self.find_in_arr(data_obj.keys(), lambda key: "native" in key))
            non_native_dashboard_keys = list(
                filter(lambda key: "dashboard" not in key and "native" not in key, data_obj.keys())
            )
            for non_native_dashboard_key in non_native_dashboard_keys:
                add_bundle_to_lists(non_native_dashboard_key)

        for bundle in data_obj:
            add_bundle_to_lists(bundle)

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


DEFAULT_MAP = {
    "cow-components-native": "CC UI library (Web Components)",
    "cow-components-angular": "CC UI library (Angular wrapper)",
    "cow-components-react": "CC UI library (React wrapper)",
    "cow-components-svelte": "CC UI library (Svelte wrapper)",
    "cow-components-basic-native": "CC UI library (reduced size, Web Components)",
    "cow-components-basic-angular": "CC UI library (reduced size, Angular wrapper)",
    "cow-components-basic-react": "CC UI library (reduced size, React wrapper)",
    "cow-components-basic-svelte": "CC UI library (reduced size, Svelte wrapper)",
}

BUNDLE_RENAME_MAPS = {
    "DEFAULT_MAP": {
        **DEFAULT_MAP,
        "dashboard": "original Angular components",
    },
    "DASHBOARD_MAP": {**DEFAULT_MAP, "dashboard": "30MHz dashboard"},
    "WEB_COMPONENTS_MAP": {**DEFAULT_MAP, "dashboard": "CC UI Library"},
}


def rewrite_bundle(bundle: str, map_name: str = "DEFAULT_MAP") -> str:
    if bundle in BUNDLE_RENAME_MAPS[map_name]:
        return BUNDLE_RENAME_MAPS[map_name][bundle]
    return bundle


def create_dataframe(
    data: Data,
    get_data: Callable[[BundleData], Any],
    bundle_label: str,
    data_label: str,
    framework_label: str,
    rename_map: str,
) -> pd.DataFrame:
    obj = {bundle_label: [], data_label: [], framework_label: []}
    for bundle in data.iter_bundles():
        data = get_data(bundle)
        if data == None:
            continue
        data_list = data if type(data) == list else [data]
        for data_part in data_list:
            obj[bundle_label].append(rewrite_bundle(bundle.bundle, rename_map))
            obj[framework_label].append(bundle.framework)
            obj[data_label].append(data_part)

    return pd.DataFrame(obj)


def create_plot(
    title: str,
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
    dodge: bool = False,
    rename_map: str = "DEFAULT_MAP",
) -> pd.DataFrame:
    sns = get_sns()
    df = (
        data_frame
        if data_frame is not None
        else create_dataframe(data, get_data, bundle_label, data_label, framework_label, rename_map)
    )
    if figsize:
        plt.figure(figsize=figsize)
    if rotate_labels:
        plt.xticks(rotation=rotation)
    else:
        plt.xticks(rotation=0)

    print_data(df, bundle_label, data_label, getattr(extra_dict, "hue", None))

    if plot_type == "boxen":
        ax = sns.boxenplot(x=bundle_label, y=data_label, data=df, *extra, **extra_dict, dodge=dodge)
    elif plot_type == "box":
        ax = sns.boxplot(x=bundle_label, y=data_label, data=df, *extra, **extra_dict, dodge=dodge)
    elif plot_type == "boxen-dots":
        ax = sns.boxenplot(x=bundle_label, y=data_label, data=df, *extra, **extra_dict, showfliers=False, dodge=dodge)
        ax = sns.stripplot(x=bundle_label, y=data_label, data=df, size=2, color=".26")
    elif plot_type == "scatter":
        ax = sns.scatterplot(x=bundle_label, y=data_label, data=df, *extra, hue="framework")
    else:
        raise Exception(f'Unknown plot type "{plot_type}"')
    ax.set_title(title)
    plt.tight_layout()
    return ax


def get_data(database_name: str = DEFAULT_DATABASE_NAME) -> Data:
    current_dir = os.path.dirname(os.path.realpath(__file__))
    file_path = os.path.join(current_dir, f"../../../metrics/data/{database_name}.json")

    json_content: Dict[str, Any]
    with open(file_path, "r") as json_file:
        json_content = json.load(json_file)

    return Data(json_content["metrics"])
