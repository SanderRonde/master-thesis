import os
import pathlib
import matplotlib.pyplot as plt


def write_plot(axes: plt.Axes, fig_name: str):
    cur_dir = os.path.dirname(os.path.realpath(__file__))
    plot_dir = os.path.join(cur_dir, "../../src/plots")
    pathlib.Path(plot_dir).mkdir(parents=True, exist_ok=True)
    out_path = os.path.realpath(os.path.join(plot_dir, f"{fig_name}.png"))
    fig = axes.get_figure() if hasattr(axes, "get_figure") else axes
    fig.savefig(out_path)
    print(f"Wrote plot to {out_path}")
