// THIS PACKAGE SHOULD NOT BE USED DIRECTLY
// use `@mikro-orm/core` instead

// `mikro-orm` is a metapackage. Originally it was used in v3 and lower, with v4 and monorepo rewrite,
// it served as a way to easy the transition to using `@mikro-orm/core` and other packages like `cli`.
// This caused issues with dependency resolutions and using `@mikro-orm/core` was always the encouraged way.
// In v5, the package has no dependencies and is used purely for tracking the right numbers on GH page and
// other stats (e.g. npmtrends), where people often compared other libraries with `mikro-orm` instead of
// `@mikro-orm/core`. The `@mikro-orm/core` now directly depends on this package, so the download numbers
// are propagated to the `mikro-orm` package too.
