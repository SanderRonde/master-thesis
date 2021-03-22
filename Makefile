MAKEFILE_DIR:=$(realpath $(dir $(abspath $(lastword $(MAKEFILE_LIST)))))
METRICS_DIR:=$(MAKEFILE_DIR)/metrics/collectors
YARN_CMD:=yarn --cwd $(METRICS_DIR)

.PHONY: metrics


metrics_install:
	$(YARN_CMD) install

metrics: metrics_install
	$(YARN_CMD) collect

submodules:
	git submodule update --init