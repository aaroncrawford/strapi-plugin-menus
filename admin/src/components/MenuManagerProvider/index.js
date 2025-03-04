import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useFormikContext } from 'formik';
import { uniqueId } from 'lodash';

import { MenuManagerContext } from '../../contexts';
import {
  defaultItem,
  getChildren,
  getDescendants,
  sortByOrder,
} from './utils';

const MenuManagerProvider = ( { children, menu } ) => {
  const { setValues, values } = useFormikContext();
  const [ activeMenuItem, setActiveMenuItem ] = useState( null );

  const items = useMemo( () => {
    const rootItems = values.items.filter( item => ! item.parent );

    // Recursively add descendant items to top-level items.
    const nestedItems = rootItems.map( item => ( {
      ...item,
      children: getDescendants( item.id, values.items, true ),
    } ) );

    return sortByOrder( nestedItems );
  }, [ values.items ] );

  const addMenuItem = parentId => {
    const order = getChildren( parentId, values.items ).length;

    // Using the `create` prefix with the ID will help us know which items need
    // to be created on the backend when this data is saved.
    const newItem = {
      ...defaultItem,
      order,
      id: uniqueId( 'create' ),
      root_menu: { id: menu.id },
      parent: parentId ? { id: parentId } : null,
    };

    setValues( {
      ...values,
      items: [ ...values.items, newItem ],
    } );

    setActiveMenuItem( newItem );
  };

  const deleteMenuItem = id => {
    // Determine all items to delete, which includes it's descendants.
    const itemToDelete = values.items.find( item => item.id === id );
    const descendantsToDelete = getDescendants( id, values.items );

    // Create new list of items excluding all deleted items.
    let newItems = values.items.filter( item => {
      const isTarget = item.id === id;
      const isDescendant = descendantsToDelete.find( _item => _item.id === item.id );

      return ! isTarget && ! isDescendant;
    } );

    // Determine new ordering for siblings.
    const siblings = getChildren( itemToDelete?.parent?.id, newItems );
    const orderedSiblings = sortByOrder( siblings ).map( ( item, order ) => ( { ...item, order } ) );

    // Re-serialize items to keep their numbering sequential starting from 0 with their siblings.
    newItems = newItems.map( item => {
      const reorderedItem = orderedSiblings.find( _item => _item.id === item.id );

      return reorderedItem ?? item;
    } );

    setValues( {
      ...values,
      items: newItems,
    } );

    // Close edit panel if we are deleting the current active item.
    if ( activeMenuItem?.id === id ) {
      setActiveMenuItem( null );
    }
  };

  const moveMenuItem = ( id, direction ) => {
    const itemA = values.items.find( _item => _item.id === id );
    const siblings = getChildren( itemA?.parent?.id, values.items );
    const orderA = itemA.order;
    const orderB = orderA + direction;
    const itemB = siblings.find( item => item.order === orderB );

    if ( ! itemB ) {
      return;
    }

    const orderedItemA = { ...itemA, order: orderB };
    const orderedItemB = { ...itemB, order: orderA };

    // Switch the order values for items A and B.
    const orderedItems = values.items.map( item => {
      if ( item.id === itemA.id ) {
        return orderedItemA;
      }

      if ( item.id === itemB.id ) {
        return orderedItemB;
      }

      return item;
    } );

    setValues( {
      ...values,
      items: orderedItems,
    } );

    setActiveMenuItem( orderedItemA );
  };

  return (
    <MenuManagerContext.Provider value={ {
      activeMenuItem,
      addMenuItem,
      deleteMenuItem,
      items,
      moveMenuItem,
      setActiveMenuItem,
    } }>
      { children }
    </MenuManagerContext.Provider>
  );
};

MenuManagerProvider.propTypes = {
  children: PropTypes.node,
  menu: PropTypes.shape( {
    title: PropTypes.string,
    slug: PropTypes.string,
    items: PropTypes.array,
  } ),
};

export default MenuManagerProvider;
