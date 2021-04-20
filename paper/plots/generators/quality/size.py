from data import get_data, create_plot
from figures import write_plot


def generate_size_plot():
    print("Generating size plot")
    data = get_data()

    ax = create_plot(
        "scatter",
        data,
        lambda bundle_data: bundle_data.size / 1024,
        "UI Library",
        "Bundle Size (KB)",
        rotate_labels=True,
        extra_dict={"hue": "framework"},
        figsize=(7, 5),
    )
    write_plot(ax, "size")