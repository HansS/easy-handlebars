# easy-handlebars
Compilation of Handlebars templates from Gulp made easy.

Install the 'easy-handlebars' module:
``` bash
npm install easy-handlebars --save-dev
```

**Example**.

- Compile your TPLs with Gulp:
```javascript
var source = require('vinyl-source-stream');

gulp.task('tpl', function() {
    var opts = {
        // Optimize the following TPLs (use 'data = false' for this TPLs).
        noData: ['login', 'signup', 'forgot-password'],
        // Pass here the Handlebars's compiler options.
        defaultCompilerOpts: { knownHelpersOnly: true, knownHelpers: ['basePath', 'breakLines'] }
    };
    return easyHandlebars('./src/views/partials/*.html', opts)
        .pipe(source('tpl-bundle.js'))
        .pipe(gulp.dest('./public/js'));
});
```

- Include the 'Handlebars.runtime.js' library and the resulting .js file of compiling the TPLs in your app.

- Use your TPLs:
```javascript
var someTplFileNameTpl = Handlebars.partials['someTplFileName'];
var someTplFileNameHtml = someTplFileNameTpl();
document.getElementById('content').innerHTML = someTplFileNameHtml;
```
