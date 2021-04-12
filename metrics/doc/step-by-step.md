# Angular-specific

* [ng-deep](#Ng-deep)
* [encapsulation](#encapsulation)
* [create-custom-element](#create-custom-element)
* [Event handlers & emitters](#Event-handlers-&-emitters)
* [Angular not supporting hierarchical injectors](#Angular-not-supporting-hierarchical-injectors)
* [`NgOnInit` being called while inputs are not fully initialized](#`NgOnInit`-being-called-while-inputs-are-not-fully-initialized)
* [Handling casing in attribute names](#Handling-casing-in-attribute-names)
* [Bundle along Angular imports](#Bundle-along-Angular-imports)
* [Making directives work](#Making-directives-work)
* [Fixing angular <ng-content>](#Fixing-angular-<ng-content>)

# Web-Component Generic

* ~~[CSS Wrappers](#CSS-Wrappers)~~
* ~~[Compatibility](#Compatibility)~~
* ~~[Use of internal tagnames](#Use-of-internal-tagnames)~~
* ~~[Theming](#theming)~~
* ~~[Webcomponent JSON inputs](#Webcomponent-JSON-inputs)~~
* ~~[Setting values through refs](#Setting-values-through-refs)~~

# Wrappers

* [Generating documentation](#Generating-documentation)
* [React wrapper](#React-wrapper)
* [Angular wrapper](#Angular-wrapper)
* [Svelte](#Svelte)

# Optimizations

* [Reducing time searching for CSS](#Reducing-time-searching-for-CSS)
* [Move global CSS perf hit to load](#Move-global-CSS-perf-hit-to-load)

## Ng-deep

https://github.com/30mhz/dashboard.30mhz.com/pull/1428

## Encapsulation

https://github.com/30mhz/dashboard.30mhz.com/pull/1434
https://github.com/30mhz/dashboard.30mhz.com/pull/1457

Angular has a field called encapsulation. This field allows the specifying of the encapsulation of the component at runtime. By default this value is set to emulated, which means that all components are in the same global DOM tree and all separation of CSS rules is done through classes/IDs. However, we can not use this for components that we concert to Web Components.

When for example having the webcomponent

```html
<x-element></x-element>
```

and its inner template consisting of

```html
<div id="some-child"></div>
```

Then they are rendered as

```html
<x-element Emulated>
	<div id="some-child"></div>
</x-element>
<x-element ShadowDom>
	<shadowroot>
		<div id="some-child"></div>
	</shadowroot>
</x-element>
```

While with view encapsulation ShadowDom it is rendered as

Say this element has some styles associated with it, then these styles will be inserted into the light DOM by Angular. This means the styles apply to all other nodes in the light DOM. In this case, using view encapsulation emulated will work but view encapsulation ShadowDom will not, because ShadowDom isolates `some-child` from the light DOM. However, when we render this `x-element` component inside of another shadowroot, it will not be in the light DOM and no styles will apply to it. The same problem now goes for both implementations.

```html
<some-container>
	<shadowroot>
		<x-element Emulated>
			<div id="some-child"></div>
		</x-element>
		<x-element ShadowDom>
			<shadowroot>
				<div id="some-child"></div>
			</shadowroot>
		</x-element>
	</shadowroot>
</some-container>
```

The solution would be to insert the required styles into the local root. However, we don't necessarily control that root since it might be created by the developer using the webcomponent. Because of this we need to create some wrapper around the template content, which is exactly what the ShadowRoot in `x-element` is a perfect fit for. We can now insert our styles into `x-element`'s shadowroot and have them applied to `some-child`.

In order to implement this, we need to set the encapsulation to ShadowDom to all components that fit the criteria. Unfortunately we can't just change all of them since the main app relies on everything having emulated encapsulation. So instead we refer to a single central value for our encapsulation, importing it in all componenst that fit the criteria.

```ts
// component.ts
import { NON_NATIVE_DESIGN_COMPONENT_ENCAPSULATION } from 'constants.ts';
@Component({
	selector: 'x-element',
	encapsulation: NON_NATIVE_DESIGN_COMPONENT_ENCAPSULATION,
}) // constants.ts
export const NON_NATIVE_DESIGN_COMPONENT_ENCAPSULATION =
	ViewEncapsulation.Emulated;
```

Then at build time, we replace the value in `constants.ts` and it will be updated across all components that use it.

## create-custom-element

https://github.com/30mhz/dashboard.30mhz.com/pull/1432 (sort of)

The issue where `createCustomElement` did not take a base constructor and always used `HTMLElement`.

## CSS Wrappers

https://github.com/30mhz/dashboard.30mhz.com/pull/1433

## Compatibility

https://github.com/30mhz/dashboard.30mhz.com/pull/1436

Webcomponents are not natively supported in all browsers and all versions of these browsers. While the majority of major browsers does, we still need to account for these edge cases. In addition, Safari has chosen not to implement so-called `Customized Built-In Elements`, which extend native HTML elements. We will need to find a way to support that as well.

The solution is to add so-called polyfills to the final bundle. These polyfills fill in the missing features for browsers that don't already have them.

## Use of internal tagnames

https://github.com/30mhz/dashboard.30mhz.com/pull/1452

Components are exported with a tagname constructed by prepending `cow-` to the internal name of the component. Since there are a few components that have names without a hyphen in them and having a hyphen in the name is a requirement for Custom Elements, this prefix is required. In addition it clearly separates the sources of elements and signifies that this is ours.

However, internally some components are being used in other components. For example the `switch` component is used in the `switch-option` component. (see template of `switch-option` below).

```html
<div>
	<div>
		<div>
			<span>{{ title }}</span>
			<span>{{ description }}</span>
		</div>
	</div>
	<switch></switch>
</div>
```

This works fine in the regular app since Angular will register the name `switch` to be the name of the Angular component. However, when exporting these components, we rename them and end up with `cow-switch` in this case. This means that the `<switch>` tag will no longer resolve to anything. To fix this, we need to replace every instance of `<switch>` with `<cow-switch>` in internal components. We do this by running a script that rewrites the contents of these files, looking for tagnames and replacing them if we know that they are to-be-exported Web Components.

## Theming

https://github.com/30mhz/dashboard.30mhz.com/pull/1459
https://github.com/30mhz/dashboard.30mhz.com/pull/1708

Theming needs to be throughout the whole document. This means that even within shadowroots, the themes need to apply. In order to do this, we decided on [CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties). These are defined **for the whole document**, meaning we can style everything by setting the custom properties of the root document.

The API that developers use is fairly simple. We expose a single `setTheme` function that takes a theme. It then merges the theme into the default theme and sets the matching custom properties to the specified values. The individual components use these custom properties for their styles, falling back to the default values that are used if no theme is specified.

## Event handlers & emitters

https://github.com/30mhz/dashboard.30mhz.com/pull/1484

Angular implements so-called `EventEmitter`s. These are able to emit events and are able to be listened to. They can fire and listen for any value, not just events. So contrary to regular event listeners, these do not receive an instance of `Event` when triggered, but instead receive the very value that was passed to emit directly. The internal code relies on this as well. However, when converting components to custom elements, Angular does not emit the value that was passed to it, but instead emits a `CustomEvent` with its `detail` property set to that initially passed value. Since internal code counts on the emitted value being the value initially passed to it, this breaks.

When fixing this there are a few things we need to keep into account. We actually want the developers that use the library to still get events back instead of the primitives that were passed. This means we need to have some distinction between internal and external. Angular also places any event listeners at `super()` time so there is no way for us to, for example, override the `addEventListener` function and do something with that. An alternative would be to override the emitting functions but then there'd be no way to discern between internal and external event receivers.

The solution we used is to, once again, modify the source files. We look at the `component.html` files and wrap any event listeners in an unwrapper function. So `(eventName)="myHandler($event)` is turned into `(eventName)="myHandler(unwrapEvent($event))`. This function should then be provided by the component itself. We do this by using a provider containing this function. The actual `unwrapEvent` function returns `event.detail`. But it does try to make an educated guess as to whether this event came from Angular or not. It does this by checking if it's an instance of `CustomEvent` and whether the element that fired is has a dash in its name (and as such is a Web Component). We need to do this because for example an button's `click` listener should still fire an `Event` and not the string that was changed itself. Any event not fired by an Angular `EventEmitter` should not be changed. Since we can't know directly whether something was fired by an `EventEmitter`, we use this method. Seeing as there's not that many of these listeners, the chances that we ourselves are firing a `CustomEvent`, which would break our assumption, are pretty slim.

## Webcomponent JSON inputs

https://github.com/30mhz/dashboard.30mhz.com/pull/1514

At the moment the web components can only be supplied with strings, numbers and booleans as values for the attributes. With there being some caveats to numbers and booleans. They are passed as strings (so `"false"` and `"0"`, not `false` and `0`). Checks inside of components often don't notice the difference, which means this works, but often they do strictly compare and this fails.

We want to allow developers to also supply some "complex" (objects or arrays) to these web components, as well as the caveats for numbers and booleans being removed. To do this we allow them to pass the regular attribute name but prefixed with `json-` with the value being the `JSON.stringify` representation of the passed value (object, array, whatever else).

During the connecting of the component, we now iterate through all attributes and check if any are prefixed with `json-`, if they are, we parse them and set the associated `@Input` on the component. This process also occurs for attributes that are set and unset dynamically through `setAttribute` etc.

This allows us to pass (some) complex attributes, which we can use to get the switch-option working again.

## Angular not supporting hierarchical injectors

https://github.com/30mhz/dashboard.30mhz.com/pull/1569
https://github.com/30mhz/dashboard.30mhz.com/pull/1772 (later)

### Main issue:

Angular Elements does not support hierarchical injectors. This is intentional (https://github.com/angular/angular/issues/24824#issuecomment-404399564). The reason it fails is that every component is created as a new root. As such it has no idea who its parents are, and it does not inherit their injector's providers. This is a problem because now it has no access to any injectors they may provide. While this is a pattern that is [not recommended](https://github.com/angular/angular/issues/24824#issuecomment-404399564) by the Angular developers, we do use this pattern a few times in our code. To work around this, we provide our own element strategy (basically a component's controller) which we use to manually create a new injector that **does** inherit from the parent injector. We find this parent injector by going up the tree, finding the parent HTML element and using some hacks to get the underlying Angular object, from which we take the injector. See https://github.com/angular/angular/issues/40104#issuecomment-744565450 for a demo of the workaround

### Getting the default strategy

We want to extract a reference to the `ComponentNgElementStrategy` class. This class is the default `NgElementStrategy` used by Angular for its custom elements. We want to extend this class (to provide our own strategy), for which we need a reference to the base class.

Because Angular does not export this class for convenience (because apparently they hate convenience and extendability), we extract it through some hacks. The alternative is to copy the code itself.

We do this by creating a new custom element from a regular Angular component. When this element is instantiated, it has an `ngElementStrategy` property getter that returns an instance of the element strategy for that element. Since we don't actually care about the component instance and just want that property, we access this property statically by accessing its constructor.

In the process of creating this strategy, the `ngElementStrategy` getter requires an injector. We don't actually want to pass an injector since we don't want to affect the rest of the runtime. Instead, we mock an injector by mocking the get function.

Finally, when we get this `ngElementStrategy` we have an instance of `ComponentNgElementStrategy`. We then take the constructor and then we have it and are able to extend the class.

See https://github.com/angular/angular/issues/26112 for more people who have the same issue and for the reason it's not public.

### Getting the `NodeInjector` class

We need an instance of a `NodeInjector` so that we can set it as the parent of the created injector in the component strategy (see custom-element-strategy.ts).

First some explanation on injectors in Angular. Angular internally has two types of injectors. The `Injector` class import you see here below, and the `NodeInjector` class, which can not be imported. They are treated the exact same when it comes to typings. So both of them are assignable to the `Injector` "interface", and this is the common interface that is used to describe instances of the class. So say you have two classes, one with an `Injector` class instance as a property, and one with a `NodeInjector` class instance, they are both typed the following way:

```ts
class MyClass {
	myProperty: Injector;
}
```

Regardless of the fact that these are different classes.

We only want the `NodeInjector`, which is of course not exported. We want it because it has scoped access to Angular-internal functions, which we can't access. For example:

```ts
function mySecretFunction() { } // Not exported
class NodeInjector {
   get(...) {
       mySecretFunction(...);
   }
}
```

There is one place where it is accessible though, and that is the `injector` property of a component instance created from a component factory.

We use that to get a reference to a `NodeInjector`, which we can use to get the constructor, which we can then use to create our own `NodeInjector`.

## `NgOnInit` being called while inputs are not fully initialized

https://github.com/30mhz/dashboard.30mhz.com/pull/1570

Angular Elements (the library we use to turn Angular components into webcomponents) does not guarantee the order in which attributes are attached to an element. This means attributes can be attached **after** `ngOnInit` has been called. For example Angular can generate code in the following three ways and there is no guarantee which one is used:

```ts
// 1
const element = document.createElement('my-el');
element.setAttribute('my-attr', 'value');
element.setAttribute('another-attr', 'value');
parent.appendChild(element); // ngOnInit called here

// 2
const element = document.createElement('my-el');
parent.appendChild(element); // ngOnInit called here
element.setAttribute('my-attr', 'value');
element.setAttribute('another-attr', 'value');

// 3
const element = document.createElement('my-el');
element.setAttribute('my-attr', 'value');
parent.appendChild(element); // ngOnInit called here
element.setAttribute('another-attr', 'value');
```

Note that even if we pass it the code

```html
<my-el my-attr="value" another-attr="value" />
```

It can (and often does) still generate code of type 2 and 3 (see above). This means we can't even be certain the inputs we explicitly instantiate it with are actually passed along.

To fix this issue, we make `ngOnInit` a dummy function that does nothing until the whole `connect` cycle is completed (during which `ngOnInit` is normally called). After it is done, we call `ngOnInit` manually, knowing that now all inputs we gave it initially are set. To hook into the first lifecycle hook after everything is set (and call `ngOnInit` from there), we'd have to hook into `ngOnChanges`. That is a whole lot of work and involves extending the default `NgElementStrategy` (which we'd have to get a hold of first) etc. Looking at the element strategy code directly, we can see that the following is basically happening:

```ts
connect(element);
window.requestAnimationFrame(() => {
	component.ngOnChanges();
});
```

So our solution to "hooking into `ngOnChanges`" is to basically run `requestAnimationFrame` after `connect`.

See this issue for more info and their reasoning for not fixing it: https://github.com/angular/angular/issues/29050

## Handling casing in attribute names

https://github.com/30mhz/dashboard.30mhz.com/pull/1599

## Bundle along Angular imports

https://github.com/30mhz/dashboard.30mhz.com/pull/1654

## Making directives work

https://github.com/30mhz/dashboard.30mhz.com/pull/1649

## Setting values through refs

https://github.com/30mhz/dashboard.30mhz.com/pull/1603

## Fixing angular <ng-content>

https://github.com/30mhz/dashboard.30mhz.com/pull/1742

# Wrappers

## Generating documentation

https://github.com/30mhz/dashboard.30mhz.com/pull/1494
https://github.com/30mhz/dashboard.30mhz.com/pull/1593
https://github.com/30mhz/dashboard.30mhz.com/pull/1656
https://github.com/30mhz/dashboard.30mhz.com/pull/1670
https://github.com/30mhz/dashboard.30mhz.com/pull/1678
https://github.com/30mhz/dashboard.30mhz.com/pull/1741

## React wrapper

https://github.com/30mhz/dashboard.30mhz.com/pull/1653
https://github.com/30mhz/dashboard.30mhz.com/pull/1644
https://github.com/30mhz/dashboard.30mhz.com/pull/1612 ???
https://github.com/30mhz/dashboard.30mhz.com/pull/1604
https://github.com/30mhz/dashboard.30mhz.com/pull/1671

## Angular wrapper

https://github.com/30mhz/dashboard.30mhz.com/pull/1648
https://github.com/30mhz/dashboard.30mhz.com/pull/1672
https://github.com/30mhz/dashboard.30mhz.com/pull/1673

https://github.com/30mhz/dashboard.30mhz.com/pull/1650

### Disabling AOT and not using ivy

Angular does not allow the use of Ivy for libraries as of now. This has to do with the fact that Ivy is not yet marked as stable, and as such, it might be possible that it causes bugs in production. However, this introduces a few bugs that are supposedly fixed in Ivy. For example [this one](https://github.com/angular/angular/issues/25424). This was only fixed by disabling AOT altogether, slowing down the app tremendously.

https://github.com/30mhz/dashboard.30mhz.com/pull/1632 ???
https://github.com/30mhz/dashboard.30mhz.com/pull/1631 ???

## Svelte

https://github.com/30mhz/dashboard.30mhz.com/pull/1739
https://github.com/30mhz/dashboard.30mhz.com/pull/1743

# Demos

## Vue2

https://github.com/30mhz/dashboard.30mhz.com/pull/1720

## Vue3

https://github.com/30mhz/dashboard.30mhz.com/pull/1729
https://github.com/30mhz/dashboard.30mhz.com/pull/1726
https://github.com/30mhz/dashboard.30mhz.com/pull/1728

## Polymer

https://github.com/30mhz/dashboard.30mhz.com/pull/1735
https://github.com/30mhz/dashboard.30mhz.com/pull/1736

## Lit-element

https://github.com/30mhz/dashboard.30mhz.com/pull/1737

## Wc-lib

https://github.com/30mhz/dashboard.30mhz.com/pull/1756

# Optimizations

## Reducing time searching for CSS

https://github.com/30mhz/dashboard.30mhz.com/pull/1780

## Move global CSS perf hit to load

https://github.com/30mhz/dashboard.30mhz.com/pull/1781
