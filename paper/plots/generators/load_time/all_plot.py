from data import get_data, create_plot
from figures import write_plot
import matplotlib.pyplot as plt


def generate_load_time_all_plot():
    print("Generating Load Time all plot")
    data = get_data()

    ax = create_plot(
        "boxen",
        data,
        lambda bundle_data: bundle_data.load_time.values,
        "UI Library",
        "Load time of main bundle (ms)",
        rotate_labels=True,
        extra_dict={"hue": "framework"},
        figsize=(7, 5),
    )
    ax.set_yscale("log")

    write_plot(ax, "load-time-all")