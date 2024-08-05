import React from 'react';
import SearchIcon from '@material-ui/icons/Search';
import { SidebarItem } from '@backstage/core-components';
import { IconComponent } from '@backstage/core-plugin-api';
import {
  SearchModalChildrenProps,
  SearchModalProvider,
  useSearchModal,
} from '@backstage/plugin-search';
import { SearchModal } from './SearchModal';

/**
 * Props for {@link SidebarSearchModal}.
 *
 * @public
 */
export type SidebarSearchModalProps = {
  icon?: IconComponent;
  children?: (props: SearchModalChildrenProps) => JSX.Element;
};

const SidebarSearchModalContent = (props: SidebarSearchModalProps) => {
  const { state, toggleModal } = useSearchModal();
  const Icon = props.icon ? props.icon : SearchIcon;

  return (
    <>
      <SidebarItem
        className="search-icon"
        icon={Icon}
        text="Search"
        onClick={toggleModal}
      />
      <SearchModal
        {...state}
        toggleModal={toggleModal}
        children={props.children}
      />
    </>
  );
};

export const SidebarSearchModal = (props: SidebarSearchModalProps) => {
  return (
    <SearchModalProvider>
      <SidebarSearchModalContent {...props} />
    </SearchModalProvider>
  );
};
