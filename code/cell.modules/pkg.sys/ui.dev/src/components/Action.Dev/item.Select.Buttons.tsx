import React from 'react';

import { color, COLORS, css, SelectUtil, t, R } from '../common';
import { Icons } from '../Icons';
import { Button, Radios, Checkboxes } from '../Primitives';
import { Layout, LayoutTitle } from './Layout';

export type SelectButtonsProps = { namespace: string; bus: t.EventBus; item: t.ActionSelect };

export const SelectButtons: React.FC<SelectButtonsProps> = (props) => {
  const { namespace, item } = props;
  const bus = props.bus.type<t.DevActionEvent>();

  const { title, label, description, isSpinning, multi } = item;
  const isActive = item.handlers.length > 0;
  const options = item.items.map((value) => SelectUtil.toOption(value));
  const current = Array.isArray(item.current) ? item.current : [item.current];

  const styles = {
    base: css({ position: 'relative' }),
    body: css({ marginTop: label === undefined ? 0 : 8 }),
  };

  const fireSelect = (next: t.ActionSelectItem[]) => {
    bus.fire({
      type: 'dev:action/Select',
      payload: { namespace, item, changing: { next } },
    });
  };

  const elTitle = title && <LayoutTitle>{title}</LayoutTitle>;

  const elRadios = !multi && (
    <Radios
      items={options}
      selected={current[0]}
      isClearable={item.clearable}
      onClick={(e) => {
        if (e.action.select) {
          fireSelect([e.item]);
        }
        if (e.action.deselect && item.clearable) {
          fireSelect([]);
        }
      }}
    />
  );

  const elCheckboxes = multi && (
    <Checkboxes
      items={options}
      selected={current}
      isClearable={item.clearable}
      onClick={(e) => {
        if (e.action.select) {
          fireSelect(R.uniq([...current, e.item]));
        }
        if (e.action.deselect) {
          const next = current.filter((item) => !R.equals(e.item, item));
          fireSelect(next);
        }
      }}
    />
  );

  const elBody = (
    <div {...styles.body}>
      {elRadios}
      {elCheckboxes}
    </div>
  );

  const elClear = item.clearable && (
    <Button onClick={() => fireSelect([])}>
      <Icons.Close size={18} />
    </Button>
  );

  return (
    <div {...styles.base}>
      <Layout
        isActive={isActive}
        isSpinning={isSpinning}
        label={label}
        labelColor={COLORS.DARK}
        body={elBody}
        icon={{
          Component: Icons.Checklist,
          color: color.alpha(COLORS.DARK, 0.4),
        }}
        description={description}
        placeholder={item.isPlaceholder}
        top={elTitle}
        right={elClear}
        pressOffset={0}
      />
    </div>
  );
};
