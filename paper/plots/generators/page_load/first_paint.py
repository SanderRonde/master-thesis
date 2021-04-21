import pandas as pd

from data import get_data, create_plot, rewrite_bundle
from figures import write_plot


def generate_first_paint_plot():
    print("Generating first paint plot")
    data = get_data()

    obj = {"UI Library": [], "Time (ms)": [], "Metric": []}
    for bundle in data.iter_bundles():
        if not bundle.page_load_time:
            continue
        for value in bundle.page_load_time.first_paint.values:
            obj["UI Library"].append(rewrite_bundle(bundle.bundle))
            obj["Metric"].append("First Paint")
            obj["Time (ms)"].append(value)
        for value in bundle.page_load_time.first_contentful_paint.values:
            obj["UI Library"].append(rewrite_bundle(bundle.bundle))
            obj["Metric"].append("First Contentful Paint")
            obj["Time (ms)"].append(value)

    df = pd.DataFrame(obj)
    ax = create_plot(
        "Page load time\nLower is better",
        "boxen",
        data,
        None,
        "UI Library",
        "Time (ms)",
        rotate_labels=True,
        rotation=45,
        figsize=(7, 5),
        extra_dict={"hue": "Metric", "linewidth": 0.4},
        data_frame=df,
        dodge=True,
    )
    write_plot(ax, "first-contentful-paint")