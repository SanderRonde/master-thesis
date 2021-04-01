import { flag } from 'makfy';
import {
	ArgDefinitions,
	ArgsInstance,
	FlagArgDefinition,
} from 'makfy/dist/lib/schema/args';
import {
	cmd,
	Command,
	CommandBuilder,
	CommandRunFn,
} from 'makfy/dist/lib/schema/commands';
import { ExecCommand, ExecObject } from 'makfy/dist/lib/schema/runtime';
import { setContexts } from './helpers';

/**
 * Preserves the return value of given command builder
 * when calling any functions on it. So say you have
 * a command builder `X`, then
 * calling `X.run()` returns `void`. Calling
 * `preserveReturnValue(X).run()` returns `X`.
 *
 * We use this to preserve the Makfy `CommandBuilder`
 * object so we can use it to create references to tasks
 * later on but still preserve the chaining nature of
 * the command.
 */
export function preserveCommandBuilder<TA extends ArgDefinitions>(
	builder: CommandBuilder<TA>
): Omit<Command<TA>, 'run'> & {
	run(runFn: CommandRunFn<TA>): CommandBuilder<TA>;
	run(...inlineCommands: ExecCommand[]): CommandBuilder<TA>;
} {
	return {
		...builder,
		run(...args: any[]) {
			builder.run(...(args as any));
			return builder;
		},
	};
}

function getCommandName(builder: CommandBuilder<any>): string {
	// This is private but we know it's there so we can
	// access it
	return ((builder as unknown) as {
		name: string;
	}).name;
}

export function getCommandBuilderExec<TA extends ArgDefinitions>(
	builder: CommandBuilder<TA>,
	args?: Partial<ArgsInstance<TA>>
): ExecObject {
	return {
		_: getCommandName(builder),
		args: args as any,
	};
}

type MetricsArgDefinitions = {
	'no-cache': FlagArgDefinition;
	prod: FlagArgDefinition;
	'log-debug': FlagArgDefinition;
};

export const METRICS_COMMAND_ARGS = {
	'no-cache': flag(),
	prod: flag(),
	'log-debug': flag(),
};
export const METRICS_COMMAND_ARG_DESCRIPTIONS = {
	'no-cache': "Don't use cache and force rebuild",
	prod: 'Run in production mode',
	'log-debug': 'Whether to log debug messages, even in prod mode',
};

export function registerMetricsCommand(
	name: string
): {
	run(
		runFn: CommandRunFn<MetricsArgDefinitions>
	): CommandBuilder<MetricsArgDefinitions>;
} {
	let runHandler: CommandRunFn<MetricsArgDefinitions> | null = null;

	const builder = cmd(`${name}-metrics`)
		.desc(`Collect ${name} metrics`)
		.args(METRICS_COMMAND_ARGS)
		.argsDesc(METRICS_COMMAND_ARG_DESCRIPTIONS);
	builder.run(async (exec, args) => {
		exec = await setContexts(exec, args);

		if (runHandler) {
			await runHandler(exec, args);
		}
	});

	return {
		run(handler: CommandRunFn<MetricsArgDefinitions>) {
			runHandler = handler;

			return builder;
		},
	};
}
