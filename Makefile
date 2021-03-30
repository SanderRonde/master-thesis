MAKEFILE_DIR:=$(realpath $(dir $(abspath $(lastword $(MAKEFILE_LIST)))))
METRICS_DIR:=$(MAKEFILE_DIR)/metrics/collectors
YARN_CMD:=yarn --cwd $(METRICS_DIR)

.PHONY: metrics

submodules:
	git submodule update --init

metrics_install:
	$(YARN_CMD) install

metrics: submodules metrics_install
	$(YARN_CMD) metrics --no-cache

metrics-dev: submodules metrics_install
	$(YARN_CMD) metrics-dev