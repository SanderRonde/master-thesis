from data import get_data, create_plot
from figures import write_plot


def generate_cyclomatic_complexity_plot():
    print("Generating cyclomatic complexity plot")
    data = get_data()

    ax = create_plot(
        "boxen",
        data,
        lambda bundle_data: list(filter(lambda x: x != -1, bundle_data.cyclomatic_complexity.component_time_map.values())),
        "UI Library",
        "Cyclomatic Complexity",
        rotate_labels=True,
        extra_dict={"hue": "framework", "linewidth": 0.5},
        figsize=(8, 6),
    )
    write_plot(ax, "cyclomatic-complexity")