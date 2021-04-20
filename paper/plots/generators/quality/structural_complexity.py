from data import get_data, create_plot
from figures import write_plot


def generate_structural_complexity_plot():
    print("Generating structural complexity plot")
    data = get_data()

    ax = create_plot(
        "Structural complexity\nLower is better",
        "boxen",
        data,
        lambda bundle_data: list(filter(lambda x: x != -1, bundle_data.structural_complexity.component_time_map.values())),
        "UI Library",
        "Structural Complexity",
        rotate_labels=True,
        extra_dict={"hue": "framework"},
        figsize=(8, 6),
    )
    write_plot(ax, "structural-complexity")