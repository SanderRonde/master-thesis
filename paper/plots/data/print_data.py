from typing import Optional
import pandas as pd
import sys


def print_data(data: pd.DataFrame, x_label: str, y_label: str, hue_label: Optional[str]):
    print("\n\n\n\n")
    if "--print-stats" in sys.argv:
        median_label = f"{y_label} (median)"
        mean_label = f"{y_label} (mean)"
        new_df = {x_label: [], median_label: [], mean_label: []}
        if hue_label:
            new_df[hue_label] = []

        for x_value in data[x_label].unique():
            x_values = data[data[x_label] == x_value]
            hue_values = x_values[hue_label].unique() if hue_label else [True]
            for hue_value in hue_values:
                values = x_values[x_values[hue_label] == hue_value] if hue_value != True else x_values

                new_df[x_label].append(x_value)
                new_df[median_label].append(values[y_label].median())
                new_df[mean_label].append(values[y_label].mean())
                if hue_label:
                    new_df[hue_label].append(hue_value)

        print(pd.DataFrame(new_df))
