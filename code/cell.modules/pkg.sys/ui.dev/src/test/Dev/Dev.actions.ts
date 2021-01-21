import { Actions } from '../..';
import { StateObject, t } from '../../common';

type Ctx = {
  model: t.IStateObjectWritable<M>;
  change: t.IStateObjectWritable<M>['change'];
};
type M = { text?: string; position?: t.IHostLayoutAbsolute };

const LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque nec quam lorem. Praesent fermentum, augue ut porta varius, eros nisl euismod ante, ac suscipit elit libero nec dolor.';

const model = StateObject.create<M>({ text: LOREM });

const change = (model: Ctx['model']) => {
  model.change((draft) => (draft.text = draft.text === 'hello' ? LOREM : 'hello'));
};

/**
 * Actions
 */
export const actions = Actions<Ctx>()
  .context((prev) => prev || { model, change: model.change })

  .button('foo', (ctx) => change(ctx.model))
  .button((e) => e.label(LOREM))
  .button((e) => e.description(LOREM))

  .hr()
  .title('Group 1')

  .button('change text', (ctx) => change(ctx.model))
  .hr(0)
  .button((config) => config.label('hello'))
  .hr(1, 0.14, [5, 0])
  .button('console.log', (ctx) => console.log('hello', ctx))

  .hr()
  .title('Group 2')

  .button('center (clear)', (ctx) => ctx.change((draft) => (draft.position = undefined)))
  .button('top left', (ctx) => ctx.change((draft) => (draft.position = { top: 50, left: 50 })))
  .hr()
  .title('color')
  .button('red', () => null)
  .button('green', () => null)
  .button('blue', () => null);