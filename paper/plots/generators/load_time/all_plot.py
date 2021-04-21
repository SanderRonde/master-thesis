from data import get_data, create_plot
from figures import write_plot

def generate_load_time_all_plot():
    print("Generating Load Time all plot")
    data = get_data()

    ax = create_plot(
        "Load time of main bundle\nLower is better",
        "boxen",
        data,
        lambda bundle_data: bundle_data.load_time.values,
        "UI Library",
        "Load time (ms)",
        rotate_labels=True,
        extra_dict={"hue": "framework", "linewidth": 0.1},
        figsize=(7, 8),
    )

    write_plot(ax, "load-time-all")


def generate_load_time_all_plot_no_angular():
    print("Generating Load Time all plot (no angular)")
    data = get_data()


    ax = create_plot(
        "Load time of main bundle (without cow-components-angular)\nLower is better",
        "boxen",
        data,
        lambda bundle_data: bundle_data.load_time.values if bundle_data.bundle != "cow-components-angular" else None,
        "UI Library",
        "Load time (ms)",
        rotate_labels=True,
        extra_dict={"hue": "framework", "linewidth": 0.1},
        figsize=(7, 8),
    )

    write_plot(ax, "load-time-all-no-angular")