import { Compiler, Package } from '@platform/cell.compiler';

export default () =>
  Compiler.config()
    .namespace('sys.runtime.web.ui')
    .version(Package.version)

    .variant('web', (config) =>
      config
        .title('cell')
        .target('web')
        .port(5051)

        .entry('main', './src/entry/main')
        .entry('service.worker', './src/workers/service.worker')
        .entry('web.worker', './src/workers/web.worker')

        .static('static')
        .files((e) => e.redirect(false, '*.worker.js').access('public', '**/*.{png,jpg,svg}'))
        .shared((e) => e.add(e.dependencies).singleton(['react', 'react-dom']))

        .expose('./Dev', './src/Dev.Harness'),
    );
