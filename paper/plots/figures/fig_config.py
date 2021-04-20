import seaborn as sns


def get_sns() -> sns:
    sns.set_theme(style="darkgrid")
    sns.set_context("paper")
    return sns
