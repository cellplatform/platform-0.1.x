import * as React from 'react';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

import {
  color,
  COLORS,
  CommandChangeDispatcher,
  constants,
  containsFocus,
  css,
  events,
  GlamorValue,
  ICommandChangeArgs,
} from '../../common';
import { TextInput, TextInputChangeEvent } from '../primitives';

const { MONOSPACE } = constants.FONT;
const { CLI } = COLORS;
const FONT_SIZE = 14;

export type ICommandPromptProps = {
  text?: string;
  focusOnKeypress?: boolean;
  style?: GlamorValue;
  onChange?: CommandChangeDispatcher;
};
export type ICommandPromptState = {
  // input?: string;
};

export class CommandPrompt extends React.PureComponent<ICommandPromptProps, ICommandPromptState> {
  public state: ICommandPromptState = {};
  private unmounted$ = new Subject();
  private state$ = new Subject<ICommandPromptState>();

  private elInput: TextInput | undefined;
  private elInputRef = (ref: TextInput) => (this.elInput = ref);

  /**
   * [Lifecycle]
   */

  constructor(props: ICommandPromptProps) {
    super(props);
    this.state$.pipe(takeUntil(this.unmounted$)).subscribe(e => this.setState(e));

    const keypress$ = events.keyPress$.pipe(takeUntil(this.unmounted$));
    keypress$
      // Focus on any keypress.
      .pipe(
        filter(e => this.props.focusOnKeypress),
        filter(() => !containsFocus(this)),
        filter(() => (document.activeElement ? document.activeElement.tagName !== 'INPUT' : true)),
      )
      .subscribe(e => this.focus());

    keypress$
      // Invoke on [Enter]
      .pipe(filter(e => e.key === 'Enter'))
      .subscribe(e => this.fireInvoke());

    keypress$
      // Clear on CMD+K
      .pipe(filter(e => e.key === 'k' && e.metaKey))
      .subscribe(e => this.clear());
  }

  public componentWillUnmount() {
    this.unmounted$.next();
  }

  /**
   * [Properties]
   */
  public get text() {
    return this.props.text || '';
  }

  // public set text(input: string | undefined) {
  //   this.state$.next({ input });
  // }

  /**
   * [Methods]
   */
  public focus() {
    if (this.elInput) {
      this.elInput.focus();
    }
  }

  public clear() {
    this.fireChange(false, '');
  }

  /**
   * [Render]
   */

  public render() {
    const styles = {
      base: css({
        position: 'relative',
        boxSizing: 'border-box',
        flex: 1,
        backgroundColor: COLORS.DARK,
        color: COLORS.WHITE,
        height: 32,
        fontSize: FONT_SIZE,
        Flex: 'horizontal-center-start',
        fontFamily: MONOSPACE.FAMILY,
      }),
      prefix: css({
        color: CLI.MAGENTA,
        userSelect: 'none',
        marginLeft: 10,
        marginRight: 5,
        fontWeight: 600,
      }),
      textbox: css({
        flex: 1,
      }),
    };
    return (
      <div {...css(styles.base, this.props.style)}>
        <div {...styles.prefix}>{'>'}</div>
        <TextInput
          ref={this.elInputRef}
          style={styles.textbox}
          onChange={this.handleChange}
          value={this.text}
          valueStyle={{
            color: color.format(0.9),
            fontFamily: MONOSPACE.FAMILY,
            fontWeight: 'BOLD',
          }}
          placeholder={'command'}
          placeholderStyle={{ color: color.format(0.2) }}
        />
      </div>
    );
  }

  /**
   * [Handlers]
   */

  private fireChange(invoked: boolean, text?: string) {
    text = text || '';
    const { onChange } = this.props;
    const e: ICommandChangeArgs = { text, invoked };
    if (onChange) {
      onChange(e);
    }
  }

  private fireInvoke = () => {
    this.fireChange(true);
  };

  private handleChange = async (e: TextInputChangeEvent) => {
    this.fireChange(false, e.to);
  };
}
