import * as shell from "shelljs";

shell.cp("-R", "src/views", "dist/views");
shell.cp("-R", "src/public/img", "dist/public/img");