import * as shell from 'shelljs';

shell.cp('-R', 'src/views', 'dist/views');
shell.cp('-R', 'src/public/img', 'dist/public/img');
shell.cp('src/public/favicon.ico', 'dist/public/favicon.ico')
shell.cp('-R', 'node_modules/@fortawesome/fontawesome-free/webfonts', 'dist/public');