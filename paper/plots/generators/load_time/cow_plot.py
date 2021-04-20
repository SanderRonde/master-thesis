from data import get_data, create_plot
from figures import write_plot


def generate_load_time_cow_plot():
    print("Generating Load Time cow plot")
    data = get_data()

    ax = create_plot(
        "Load time of main bundle (cow bundles only) - Lower is better",
        "boxen",
        data,
        lambda bundle_data: bundle_data.load_time.values if "cow-components" in bundle_data.framework else None,
        "UI Library",
        "Load time (ms)",
        rotate_labels=True,
        extra_dict={"hue": "framework"},
        figsize=(7, 5),
    )
    write_plot(ax, "load-time-cow")