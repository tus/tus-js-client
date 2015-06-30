.PHONY: jscs
jscs:
	@./node_modules/.bin/jscs --fix lib test/spec demo
