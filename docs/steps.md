## Encapsulation

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
import { NON_NATIVE_DESIGN_COMPONENT_ENCAPSULATION } from "constants.ts";
@Component({
    selector: "x-element",
    encapsulation: NON_NATIVE_DESIGN_COMPONENT_ENCAPSULATION,
}) // constants.ts
export const NON_NATIVE_DESIGN_COMPONENT_ENCAPSULATION =
    ViewEncapsulation.Emulated;
```

Then at build time, we replace the value in `constants.ts` and it will be updated across all components that use it.

## Bundle

By default Angular exports everything as a bunch of bundles that are lazy-loaded. Since we want this to be a single drop-in bundle, we bundle everything together by concatenating all of these bundles. We are then left with a CSS and JS file. Because Angular outputs everything in both an `es5` and `es2015` version, we are left with two JS bundles that should be used in `es5` and `es2015` browsers respectively.

## Compatibility

Webcomponents are not natively supported in all browsers and all versions of these browsers. While the majority of major browsers does, we still need to account for these edge cases. In addition, Safari has chosen not to implement so-called `Customized Built-In Elements`, which extend native HTML elements. We will need to find a way to support that as well.

The solution is to add so-called polyfills to the final bundle. These polyfills fill in the missing features for browsers that don't already have them.

## Use of internal tagnames

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

Theming needs to be throughout the whole document. This means that even within shadowroots, the themes need to apply. In order to do this, we decided on [CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties). These are defined **for the whole document**, meaning we can style everything by setting the custom properties of the root document.

The API that developers use is fairly simple. We expose a single `setTheme` function that takes a theme. It then merges the theme into the default theme and sets the matching custom properties to the specified values. The individual components use these custom properties for their styles, falling back to the default values that are used if no theme is specified.

## i18n

The main app uses a service for fetching i18n data. The service fetches the i18n strings for the current language whenever the language is set (or changed). However, we can't really do that since we'd be accessing something outside of the bundle. This could lead to issues whenever a version mismatch occurs. For example when the app uses `strings.button` along with the bundle and then decides to rename it to `strings.otherbutton` (removing `strings.button`), then if the bundle is not updated yet it will try to refer to the no longer existent `strings.button`. In order to fix this we need to keep everything in a single bundle. What we do is we simply bundle the 118n strings files with the main bundle. We then hook into the function that would normally fetch the strings and instead tell it where to find the strings in the bundle. This way it can use the supplied strings and the bundle remains self-contained.

## Event handlers & emitters

Angular implements so-called `EventEmitter`s. These are able to emit events and are able to be listened to. They can fire and listen for any value, not just events. So contrary to regular event listeners, these do not receive an instance of `Event` when triggered, but instead receive the very value that was passed to emit directly. The internal code relies on this as well. However, when converting components to custom elements, Angular does not emit the value that was passed to it, but instead emits a `CustomEvent` with its `detail` property set to that initially passed value. Since internal code counts on the emitted value being the value initially passed to it, this breaks.

When fixing this there are a few things we need to keep into account. We actually want the developers that use the library to still get events back instead of the primitives that were passed. This means we need to have some distinction between internal and external. Angular also places any event listeners at `super()` time so there is no way for us to, for example, override the `addEventListener` function and do something with that. An alternative would be to override the emitting functions but then there'd be no way to discern between internal and external event receivers.

The solution we used is to, once again, modify the source files. We look at the `component.html` files and wrap any event listeners in an unwrapper function. So `(eventName)="myHandler($event)` is turned into `(eventName)="myHandler(unwrapEvent($event))`. This function should then be provided by the component itself. We do this by using a provider containing this function. The actual `unwrapEvent` function returns `event.detail`. But it does try to make an educated guess as to whether this event came from Angular or not. It does this by checking if it's an instance of `CustomEvent` and whether the element that fired is has a dash in its name (and as such is a Web Component). We need to do this because for example an button's `click` listener should still fire an `Event` and not the string that was changed itself. Any event not fired by an Angular `EventEmitter` should not be changed. Since we can't know directly whether something was fired by an `EventEmitter`, we use this method. Seeing as there's not that many of these listeners, the chances that we ourselves are firing a `CustomEvent`, which would break our assumption, are pretty slim.

## Update design components to work outside main app

Some design components don't work for various reasons, this mostly being assumptions that are incorrect. For example input values are always expected to be set, don't have a default value and aren't null checked. This will cause a lot of problems when they are used as Web Components. We just need to fix those by giving them a default value or doing a null check.

## Make component properties externally accessible

When Angular components are converted to Web Components, Angular does not actually use the class you passed it as the base for an HTML element. This means that, when given a `class MyAngularComponent { }`, HTML element `<my-angular-component />` will not actually be an instance of `MyAngularComponent`. This is not what we want, since inputs, outputs, and methods should be accessible on the `<my-angular-component />` as well.

We fix this issue by digging through Angular's code to find the location where an instance of `MyAngularComponent` _is_ being stored. We then recursively get a list of all of its properties. This makes sure we get the properties of that class and any properties it inherits from its supers. We then define that value on the HTML element at runtime, such that any access to one of these properties is "mapped" to the property value on the `MyAngularComponent` instance. This way, any access on `(<my-angular-component />).someProperty` maps to to `MyAngularComponent.someProperty`.

## Generating documentation

At the moment there is no documentation of any kind. We of course want some documentation since it's going to be very hard to use the components if you don't know their tagnames and attributes. Our goal is to generate a markdown file containing the tagname, attributes and events of all included components.

We do this by loading the program into Typescript. Typescript then gives us an AST representing the file. We can then iterate through it and find the properties we care about, get their types (and any possible JSDoc comments) and put them in an array.

We then turn this into a markdown file by writing some templates and inputting this data. This then eventually generates a markdown file.

## Meeting notes icon meeting

We need to ship some .woff2 file. This adds a little over 170KB

/\*\*

-   We include a new icon component that contains all of the icons
-   we currently use. These are then referenceable by name.
-   We use this internally as well. Replace all uses of
-   fa-icon with that component. Contains some 100 icons.
-   3rd parties can add a new icon by request
    \*/

I've done a bit of searching and haven't found a whole lot of additional metrics. I first checked the primary studies to look at their metrics. It turns out most of them don't use any metrics, and if they do they're mostly related to the people they target and their level of expertise, satisfaction etc. Other than this study (https://www.researchgate.net/profile/Andres_Leonardo_Martinez-Ortiz/publication/313738006_A_quality_model_for_web_components/links/5c4b5c56458515a4c74005ea/A-quality-model-for-web-components.pdf) which delivers quite a few metrics. I think we can use those on the individual web components as a good metric for their quality.
I've also looked up similar cases but can't really find any (at least on scholar). Converting components in an existing code base to Web Components seems to not be a very popular thing to do. I did find a bunch of papers on UI frameworks (aka design libraries) but they seem to not focus on metrics, and instead focus on their results and a bunch of pictures of them. There are plenty of demos and tutorials for using Angular Elements (the package we use to convert Angular components to Web Components), but I've only found one case study, which was in a medium post (so no paper). The main focus seems to be that code does not have to be duplicated, which is of course a great result but hard to create a metric for (other than before it had to be duplicated, now it hasn't). We could maybe quantify the number of hours spent on this project vs the number of hours spent maintaining the internal components. That way we can say "converting to web components took X hours, while writing it from scratch and maintaining it took Y hours, therefore converting to web components is more efficient than rewriting and maintaining a separate copy" (assuming X < Y).
I think our best bet is to focus on comparing the end result with other design libraries. There are a lot of design libraries out there, with a bunch of them being provided by companies for third parties (just like ours). There are also quite a few more metrics for that scenario. For example the ones in the above paper (if they provide the source code, which the majority does), as well as general ones like performance, code quality, bundle size. Then we can include the experience of developers that work at 30MHz, who will probably largely agree that the internal code base saw little changes and little disruption, with no code having to be duplicated for the 3rd party design library. And of course the experiences of the developers that are going to be using the design library (the quantitative metrics we discussed above). The ease of use of this design library compared to others, the completeness etc.

## Research questions:

RQ1 How viable is the process of converting Angular components to Web Components?

RQ2 How viable is the conversion from web components to various JavaScript frameworks?

With the eventual results telling the reader whether it's worth it to convert a set of existing Angular components to web components, and then to various JS frameworks vs writing these components anew.

## Subjects

Converting a set of Angular components to web components. Broken down into the various big steps required for this process.

Converting a set of web components to various JS frameworks. Broken down into the various frameworks we're targeting.

## Metrics used## Research questions:

RQ1 How viable is the process of converting Angular components to Web Components?

RQ2 How viable is the conversion from web components to various JavaScript frameworks?

With the eventual results telling the reader whether it's worth it to convert a set of existing Angular components to web components, and then to various JS frameworks vs writing these components anew.

## Subjects

Converting a set of Angular components to web components. Broken down into the various big steps required for this process.

Converting a set of web components to various JS frameworks. Broken down into the various frameworks we're targeting.

## Metrics used

### Metrics for RQ1:

-   M1: Applying the metrics in "A quality model for web components" to the resulting components
-   M2: Number of hours spent doing the conversion vs number of hours spent creating the components in the first place
-   M3: Compare other design libraries with our resulting design library in the above metrics, performance, code quality, bundle size.
-   M4: Compare our resulting design library with our regular Angular app in the metrics in M3
-   M5: Measure impact on 30MHz internal codebase
-   M6: Ask 30MHz about the disruption to the codebase and their workflow

### Metrics for RQ2:

-   M7: Compare our implementations in various JS frameworks with other design libraries in the same metrics as M3
-   M8: Compare our resulting implementations with our regular Angular app in the metrics in M3
-   M9: Ask 3rd party developers about their experience using the implementations. Focusing on the ease of use, completeness, speed and possibly more.

### Metrics for RQ1:

-   M1: Applying the metrics in "A quality model for web components" to the resulting components
-   M2: Number of hours spent doing the conversion vs number of hours spent creating the components in the first place
-   M3: Compare other design libraries with our resulting design library in the above metrics, performance, code quality, bundle size.
-   M4: Compare our resulting design library with our regular Angular app in the metrics in M3
-   M5: Measure impact on 30MHz internal codebase
-   M6: Ask 30MHz about the disruption to the codebase and their workflow

### Metrics for RQ2:

-   M7: Compare our implementations in various JS frameworks with other design libraries in the same metrics as M3
-   M8: Compare our resulting implementations with our regular Angular app in the metrics in M3
-   M9: Ask 3rd party developers about their experience using the implementations. Focusing on the ease of use, completeness, speed and possibly more.

## Webcomponent JSON inputs

At the moment the web components can only be supplied with strings, numbers and booleans as values for the attributes. With there being some caveats to numbers and booleans. They are passed as strings (so `"false"` and `"0"`, not `false` and `0`). Checks inside of components often don't notice the difference, which means this works, but often they do strictly compare and this fails.

We want to allow developers to also supply some "complex" (objects or arrays) to these web components, as well as the caveats for numbers and booleans being removed. To do this we allow them to pass the regular attribute name but prefixed with `json-` with the value being the `JSON.stringify` representation of the passed value (object, array, whatever else).

During the connecting of the component, we now iterate through all attributes and check if any are prefixed with `json-`, if they are, we parse them and set the associated `@Input` on the component. This process also occurs for attributes that are set and unset dynamically through `setAttribute` etc.

This allows us to pass (some) complex attributes, which we can use to get the switch-option working again.

## Angular not supporting hierarchical injectors

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

Angular Elements (the library we use to turn Angular components into webcomponents) does not guarantee the order in which attributes are attached to an element. This means attributes can be attached **after** `ngOnInit` has been called. For example Angular can generate code in the following three ways and there is no guarantee which one is used:

```ts
// 1
const element = document.createElement("my-el");
element.setAttribute("my-attr", "value");
element.setAttribute("another-attr", "value");
parent.appendChild(element); // ngOnInit called here

// 2
const element = document.createElement("my-el");
parent.appendChild(element); // ngOnInit called here
element.setAttribute("my-attr", "value");
element.setAttribute("another-attr", "value");

// 3
const element = document.createElement("my-el");
element.setAttribute("my-attr", "value");
parent.appendChild(element); // ngOnInit called here
element.setAttribute("another-attr", "value");
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

## Angular form control

Form control in Angular generally happens with the [form control value accessor](https://angular.io/api/forms/ControlValueAccessor). This is a directive that is used whenever the `ngModel` attribute is present on a model. This works fine when Web Components are used inside other Angular templates, but it makes interfacing with the outside world very awkward.

Because this directive is only applied inside Angular templates and not in the regular DOM (so an `index.html` file), we can't currently set the values of form control elements or listen to them.

This mixin fixes that by looking for this same `ngModel` attribute and setting the value on the component if it exists, thereby setting the value of for example the `switch-option` component. It also fires an event whenever it changes so that the value can be listened to.

## Extracting of types from components using TypeScript static analysis

For the wrapping of our design library in JS libraries, we want to provide good typings that allow the users of these wrappers to know what inputs/outputs our components have and what their types are. In order to do this, we first need to extract the exact types that we're using for the inputs/outputs from the components and make them visible and available to the user. This would be fairly simple in the following example:

```ts
class Component {
    @Input() someInput: string;
}
```

Where we could just create the following typings for for example React:

```tsx
const Component = (props: { someInput: string }) => (
    <cow-component></cow-component>
);
```

However, this is a lot more complicated in practice since most of the inputs are not primitives. Such as in the following example:

```ts
// other-module.ts
export interface Baz {
    foo: number;
}

// initial-module.ts
import { Baz } from "./other-module";

interface Foo {
    bar: Baz;
}

type MyType = Foo | string;

class Component {
    @Input() someInput: MyType;
}
```

Now we could generate the typings

```tsx
const Component = (props: { someInput: MyType }) => (
    <cow-component></cow-component>
);
```

But without a definition of `MyType` that we provide to the user, they still have no idea what the type of `someInput` is. To provide this type to the user, we need to recursively find all referenced types in an input or output's type and export those to the user. That is what this PR does. We find the type (`MyType` in this case) and find its declaration. Then we copy that **entire** declaration string into an array. This makes sure that even JSDoc is included. In this case our array would consists of the following: `["type MyType = Foo | string;"]`. This is of course still not good enough because now `Foo` is undefined. To fix this, we walk all mentioned types and copy their definitions as well (skipping whenever we find a type we already visited). This eventually gives us the following array:

```ts
[
    `export interface Baz {
	foo: number;
}`,
    `interface Foo {
	bar: Baz;
}`,
    `type MyType = Foo | string;`,
];
```

We then apply some magic to add the `export` keyword in front of every type declaration. This way we can just paste the contents of our array above our initial React definition and we have supplied the user with perfectly matching typings.

**Notes:**

-   In this PR, the code is not actually being used yet. This is just a building block for the next step, which is the actual generation of these definition files' contents.
-   The script might throw some errors at the moment since not all components are perfectly typed

Not all types are exportable or we'd have to replicate the entire `.d.ts` file generation code in TypeScript's source repo. Currently the supported types are:

-       Interfaces
-       Types
-       Enums
-       Primitives (`string`, `number` etc)
-       uiltin types (`Date`, `RegExp` etc)
-       typeof

This should only leave the cases where we refer to classes. These are easily fixable since they of them can be described by an `Interface` as well.

Cases where the type of some value is needed now also work. So for example:

```ts
const x = "a";
const y = "b";

type XAndY = typeof x | typeof y;

class MyComponent {
    @Input() someInputs: XAndY;
}
```

# Disabling AOT and not using ivy

Angular does not allow the use of Ivy for libraries as of now. This has to do with the fact that Ivy is not yet marked as stable, and as such, it might be possible that it causes bugs in production. However, this introduces a few bugs that are supposedly fixed in Ivy. For example [this one](https://github.com/angular/angular/issues/25424). This was only fixed by disabling AOT altogether, slowing down the app tremendously.

# Weird error browserslist

[https://github.com/ng-packagr/ng-packagr/issues/1411](https://github.com/ng-packagr/ng-packagr/issues/1411). This was fixed by force updating `caniuse-lite`. Fixing that led to another similar issue, which was fixed by pinning `autoprefixer`.

# Bundling dependencies

Bundlign dependencies is a requirement for us. We are using FontAwesome Pro. This is a javascript package that is only downloadable if you have a (pro) key and is not available on the regular (free) repository. As such, we can not just expect our customers to install it. We need to bundle it.

Angular however, does not like this approach. They [recommend peerDependencies](https://github.com/ng-packagr/ng-packagr/blob/v10.1.0/docs/dependencies.md). Of course, their reasoning is right and correct for a lot of situation but not this one. One way to do bundling was to use [`bundledDependencies`](https://github.com/ng-packagr/ng-packagr/issues/1106), which was used to replace the `embed` option in. However, this option is [now deprecated as well](https://github.com/ng-packagr/ng-packagr/issues/1739) without any alternative.

Our fix for this is to manually bundle all dependencies by creating bundles for them. We then reference these bundles from the package itself. We need to apply this step after building. Since Angular generates a bunch of definitions and metadata, we also need to change these definitions to point to the new bundles.

# Can't resolve arguments

When building using the `@codewithdan/observable-store` package, Angular throws an error. Since we're extending this class and turning those into Injectables, Angular also expects the parameters of this injectable to be injectables as well. Since they're not, it throws an error.

We fix this by removing this argument to the constructor altogether and making it a function call.

# Error with injector not resolving
