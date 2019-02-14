import * as React from 'react';

import { css, GlamorValue, ICreateDevToolsEvent, renderer } from '../../common';
import { Button, ObjectView } from '../primitives';

/**
 * Test component.
 */
export type IDevToolsTestProps = {
  style?: GlamorValue;
};

export class DevToolsTest extends React.PureComponent<IDevToolsTestProps> {
  public static contextType = renderer.Context;
  public context!: renderer.ReactContext;

  public render() {
    const styles = {
      base: css({ marginBottom: 50 }),
      columns: css({
        Flex: 'horizontal-start-spaceBetween',
      }),
      colButtons: css({
        lineHeight: '1.6em',
        Flex: 'vertical-start',
        paddingLeft: 15,
        flex: 1,
      }),
      colObject: css({
        flex: 1,
      }),
    };

    return (
      <div {...styles.base}>
        <h2>DevTools</h2>
        <div {...styles.columns}>
          <div {...styles.colButtons}>
            <Button label={'show (create)'} onClick={this.create} />
            <Button label={'clearConsoles'} onClick={this.clearConsoles} />
          </div>
          <div {...styles.colObject}>
            <ObjectView name={'env ("is")'} data={renderer.is.toObject()} />
          </div>
        </div>
      </div>
    );
  }

  private create = () => {
    const { id: windowId, ipc } = this.context;
    const target = ipc.MAIN;
    ipc.send<ICreateDevToolsEvent>('DEVTOOLS/create', { windowId }, { target });
  };

  private clearConsoles = () => {
    const { devTools } = this.context;
    devTools.clearConsoles();
  };
}
