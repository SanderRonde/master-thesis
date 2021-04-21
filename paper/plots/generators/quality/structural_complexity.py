from data import get_data, create_plot
from figures import write_plot


def generate_structural_complexity_plot():
    print("Generating structural complexity plot")
    data = get_data()

    ax = create_plot(
        "Structural complexity\nLower is better",
        "boxen",
        data,
        lambda bundle_data: list(
            filter(lambda x: x != -1, bundle_data.structural_complexity.component_time_map.values())
        )
        if "cow" not in bundle_data.bundle
        else None,
        "UI Library",
        "Structural Complexity",
        rotate_labels=True,
        extra_dict={"hue": "framework"},
        figsize=(8, 6),
        rename_map="WEB_COMPONENTS_MAP"
    )
    write_plot(ax, "structural-complexity")