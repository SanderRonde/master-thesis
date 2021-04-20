#!/bin/env python3


from generators import (
    generate_structural_complexity_plot,
    generate_size_plot,
    generate_cyclomatic_complexity_plot,
    generate_first_paint_plot,
    generate_lines_of_code_plot,
    generate_load_time_all_plot,
    generate_load_time_cow_plot,
    generate_render_time_all_plot,
    generate_render_time_cow_plot,
    generate_maintainability_plot,
)


def main():
    generate_size_plot()
    generate_structural_complexity_plot()
    generate_cyclomatic_complexity_plot()
    generate_maintainability_plot()
    generate_first_paint_plot()
    generate_lines_of_code_plot()
    generate_load_time_cow_plot()
    generate_load_time_all_plot()
    # generate_render_time_all_plot()
    # generate_render_time_cow_plot()


if __name__ == "__main__":
    main()
