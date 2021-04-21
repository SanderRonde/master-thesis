from data import get_data, create_plot
from figures import write_plot
import pandas as pd


def generate_render_time_all_plot_big():
    print("Generating render time all plot (big)")
    data = get_data()

    obj = {"UI Library": [], "Render time (ms)": [], "component": [], "framework": [], "Count": []}
    for bundle in data.iter_bundles():
        for component_name in bundle.render_time.component_time_map:
            if component_name not in ["Button", "Input", "Switch"]:
                continue
            for component_count in bundle.render_time.component_time_map[component_name]:
                for measurement in bundle.render_time.component_time_map[component_name][component_count].times:
                    obj["UI Library"].append(bundle.bundle)
                    obj["component"].append(component_name)
                    obj["Render time (ms)"].append(int(measurement))
                    obj["framework"].append(bundle.framework)
                    obj["Count"].append(int(component_count))

    df = pd.DataFrame(obj)

    for count in [1, 10, 100]:
        ax = create_plot(
            f"Render times of Button, Switch, and Input (component count = {count})\nLower is better",
            "boxen",
            data,
            None,
            "UI Library",
            "Render time (ms)",
            rotate_labels=True,
            extra_dict={"hue": "component", "linewidth": 0.1,"showfliers": False},
            figsize=(12, 8),
            data_frame=df[df["Count"] == count],
            dodge=True
        )
        write_plot(ax, f"render-time-all-big-{count}")
