import * as shell from 'shelljs';

shell.cp('-R', 'src/views', 'dist/views');
shell.cp('-R', 'src/public/img', 'dist/public/img');
shell.cp('-R', 'src/public/root/.', 'dist/public');
shell.cp('-R', 'node_modules/@fortawesome/fontawesome-free/webfonts',
         'dist/public');