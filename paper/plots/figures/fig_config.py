import seaborn as sns


def get_sns() -> sns:
    sns.set_theme(style="whitegrid")
    sns.set_context("paper")
    return sns
