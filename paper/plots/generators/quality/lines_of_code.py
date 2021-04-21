from data import get_data, create_plot
from figures import write_plot


def generate_lines_of_code_plot():
    print("Generating lines of code plot")
    data = get_data()

    ax = create_plot(
        "Lines of code",
        "scatter",
        data,
        lambda bundle_data: list(bundle_data.lines_of_code.component_time_map.values())
        if "cow" not in bundle_data.bundle
        else None,
        "UI Library",
        "Lines of code",
        rotate_labels=True,
        extra_dict={"hue": "framework"},
        figsize=(7, 5),
        rename_map="WEB_COMPONENTS_MAP"
    )
    write_plot(ax, "lines-of-code")