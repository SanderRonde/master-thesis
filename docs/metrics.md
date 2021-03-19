### Metrics to Ivano

Here's the same proposal but with your comments applied:

## Research questions:

RQ1 How viable is the process of migrating Angular components to Web Components?
RQ2 How viable is the migration from web components to various JavaScript frameworks?
With the eventual results telling the reader whether it's worth it to migrate a set of existing Angular components to web components, and then to various JS frameworks vs writing these components anew.

## Subjects

Migrating a set of Angular components to web components. Broken down into the various big steps required for this process.
Migrating a set of web components to various JS frameworks. Broken down into the various frameworks we're targeting.

## Metrics used

### Metrics for RQ1:

-   M1: Applying the metrics in "A quality model for web components" to the resulting components
-   M2: Number of hours spent doing the migration vs number of hours spent creating the components in the first place
-   M3: Compare other design libraries with our resulting design library in the above metrics, performance, code quality, bundle size.
-   M4: Compare our resulting design library with our regular Angular app in the metrics in M3
-   M5: Measure impact on 30MHz internal codebase. Metrics are lines of code in the main code base, number of total pull requests, number of pull requests affecting the main code base, number of additional things to keep in mind while developing. I think describing all changes that were needed here alongside the number is probably the best since the numbers aren't a perfect representation.
-   M6: Ask 30MHz about the disruption to the codebase and their workflow. This is meant to be mostly a bunch of quantative measures about their experiences. Measuring how much code they felt like was added, as well as how much they had to take into account the changes (were new requirements added while developing now, such as adding a required line of code for every component?).

### Metrics for RQ2:

-   M7: Compare our implementations in various JS frameworks with other design libraries in the same metrics as M3
-   M8: Compare our resulting implementations with our regular Angular app in the metrics in M3
-   (for later) M9: Ask 3rd party developers about their experience using the implementations. Focusing on the ease of use, completeness, speed and possibly more. (edited)
