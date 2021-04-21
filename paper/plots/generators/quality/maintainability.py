from data import get_data, create_plot
from figures import write_plot


def generate_maintainability_plot():
    print("Generating maintainability plot")
    data = get_data()

    ax = create_plot(
        "Maintainability\nHigher is better",
        "boxen",
        data,
        lambda bundle_data: list(filter(lambda x: x != -1, bundle_data.maintainability.component_time_map.values()))
        if "cow" not in bundle_data.bundle
        else None,
        "UI Library",
        "Maintainability",
        rotate_labels=True,
        extra_dict={"hue": "framework", "linewidth": 0.5},
        figsize=(8, 7),
        rename_map="WEB_COMPONENTS_MAP"
    )
    write_plot(ax, "maintainability")