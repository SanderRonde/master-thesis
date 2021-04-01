import * as ts from 'typescript';

import { TypedNamedComponentDataWithDefaultValue } from '../../../../../submodules/30mhz-dashboard/src/lib/design-library-wrappers/build/scripts/lib/extract-cow-tag-names';
import { StorybookComponentDefinition } from '../../../../../submodules/30mhz-dashboard/src/lib/storybook/scripts/generate-stories';
import { createSingleFileTSProgram } from '../../../../shared/typescript';
import { ComponentFiles } from '../../get-components';

const SELECTOR_REGEX = /(\w+)\[([-\w]+)\]/;

export type JoinedDefinition = StorybookComponentDefinition &
	TypedNamedComponentDataWithDefaultValue;

const COMPONENT_DECORATOR = 'Component';
function getComponentDeclaration(
	ast: ts.SourceFile
): {
	rootStatement: ts.ClassDeclaration;
	decorator: ts.Decorator;
} | null {
	for (const rootStatement of ast.statements) {
		// Check if it's a class
		if (ts.isClassDeclaration(rootStatement)) {
			// Check if it's preceded by an @Component call.
			// First loop over all decorators
			for (const decorator of rootStatement.decorators || []) {
				const expression = decorator.expression;
				const isComponentDecorator =
					// Check if they are a call expression
					ts.isCallExpression(expression) &&
					// Check if that call has an identifier
					// (the private static name)
					ts.isIdentifier(expression.expression) &&
					// Check if it's a call to `Component`
					expression.expression.text === COMPONENT_DECORATOR;
				if (isComponentDecorator) {
					return { rootStatement, decorator };
				}
			}
		}
	}
	return null;
}

function findValueForObjectKey(
	objectExpression: ts.ObjectLiteralExpression,
	objectKey: string
): string | null {
	for (const property of objectExpression.properties) {
		if (
			!(
				ts.isPropertyAssignment(property) &&
				ts.isIdentifier(property.name)
			)
		) {
			continue;
		}
		const propertyName = property.name.escapedText.toString();
		const isPropertyWithGivenName = propertyName === objectKey;
		if (!isPropertyWithGivenName) {
			continue;
		}
		const propertyValue = property.initializer;
		if (ts.isStringLiteral(propertyValue)) {
			return propertyValue.text;
		}
	}
	return null;
}

export async function getComponentTag(
	component: JoinedDefinition,
	cowComponents: ComponentFiles[]
): Promise<{
	tagName: string;
	attributes: string[];
}> {
	// Find the matching component file for given component
	const file = cowComponents.find((cowComponent) => {
		return cowComponent.js.componentName === component.component.name;
	});
	if (!file) {
		throw new Error(
			`Failed to find component file for component "${component.component.name}"`
		);
	}

	const tsProgram = await createSingleFileTSProgram(file.js.content);
	const rootClass = getComponentDeclaration(tsProgram.ast);
	if (!rootClass) {
		throw new Error(
			`Failed to find root component for component "${component.component.name}"`
		);
	}
	const decoratorArgs = (rootClass.decorator.expression as ts.CallExpression)
		.arguments;
	const firstDecoratorArg = decoratorArgs[0];
	if (!firstDecoratorArg) {
		throw new Error(
			`Failed to find first decorator argument for component "${component.component.name}"`
		);
	}
	const selector = findValueForObjectKey(
		firstDecoratorArg as ts.ObjectLiteralExpression,
		'selector'
	);
	if (!selector) {
		throw new Error(
			`Failed to find selector for component "${component.component.name}"`
		);
	}

	if (selector.indexOf('[') === -1) {
		return {
			tagName: selector.split(',')[0],
			attributes: [],
		};
	}

	const splitSelector = selector.split(',').map((s) => s.trim());
	const firstSelector = splitSelector[0];

	const match = SELECTOR_REGEX.exec(firstSelector);
	if (!match) {
		throw new Error(
			`Failed to match selector for component "${component.component.name}"`
		);
	}

	return {
		tagName: match[1],
		attributes: [match[2]],
	};
}
