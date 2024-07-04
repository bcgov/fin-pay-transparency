import { describe, vi, it, beforeEach, expect } from 'vitest';
import UserCard from '../UserCard.vue';
import { fireEvent, render } from '@testing-library/vue';
import { createTestingPinia } from '@pinia/testing';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { User } from '../../../types';
import { faker } from '@faker-js/faker';
import {
  ADMIN_ROLE_NAME,
  RoleLabels,
  USER_ROLE_NAME,
} from '../../../constants';

global.ResizeObserver = require('resize-observer-polyfill');
const pinia = createTestingPinia();
const vuetify = createVuetify({ components, directives });

const wrappedRender = (props: { user: User }) => {
  return render(UserCard, {
    props,
    global: {
      plugins: [pinia, vuetify],
    },
  });
};

const mockDeleteUser = vi.fn();
const mockAssignUserRole = vi.fn();
vi.mock('../../../store/modules/usersStore', () => ({
  useUsersStore: () => ({
    deleteUser: (...args) => mockDeleteUser(...args),
    assignUserRole: (...args) => mockAssignUserRole(...args),
  }),
}));

describe('UserCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render correctly', async () => {
    const user = {
      id: faker.string.uuid(),
      displayName: faker.person.fullName(),
      roles: [],
      effectiveRole: ADMIN_ROLE_NAME,
    };
    const wrapper = await wrappedRender({ user });

    expect(wrapper.getByText(user.displayName)).toBeInTheDocument();
    expect(
      wrapper.getByRole('button', { name: 'Delete user' }),
    ).toBeInTheDocument();
    expect(
      wrapper.getByRole('button', {
        name: `Role ${RoleLabels[ADMIN_ROLE_NAME]}`,
      }),
    ).toBeInTheDocument();
  });

  describe('delete user', () => {
    describe('continue after confirm', () => {
      it('should delete user', async () => {
        const user = {
          id: faker.string.uuid(),
          displayName: faker.person.fullName(),
          roles: [],
          effectiveRole: ADMIN_ROLE_NAME,
        };
        const wrapper = await wrappedRender({ user });

        const deleteButton = await wrapper.getByRole('button', {
          name: `Delete user`,
        });
        await fireEvent.click(deleteButton);

        const confirmButton = await wrapper.getByRole('button', {
          name: 'Delete',
        });
        await fireEvent.click(confirmButton);
        expect(mockDeleteUser).toHaveBeenCalledWith(user.id);
      });
    });
    describe('cancel confirmation', () => {
      it('should not delete user', async () => {
        const user = {
          id: faker.string.uuid(),
          displayName: faker.person.fullName(),
          roles: [],
          effectiveRole: ADMIN_ROLE_NAME,
        };
        const wrapper = await wrappedRender({ user });

        const deleteButton = await wrapper.getByRole('button', {
          name: 'Delete user',
        });
        await fireEvent.click(deleteButton);

        const cancelButton = await wrapper.getByRole('button', {
          name: 'Cancel',
        });
        await fireEvent.click(cancelButton);
        expect(mockDeleteUser).not.toHaveBeenCalled();
      });
    });
  });
  describe('assign role', () => {
    describe('continue after confirm', () => {
      it('should assign new role', async () => {
        const user = {
          id: faker.string.uuid(),
          displayName: faker.person.fullName(),
          roles: [],
          effectiveRole: ADMIN_ROLE_NAME,
        };
        const wrapper = await wrappedRender({ user });

        const roleButton = await wrapper.getByRole('button', {
          name: `Role ${RoleLabels[ADMIN_ROLE_NAME]}`,
        });
        await fireEvent.click(roleButton);
        const userRoleButton = await wrapper.getByRole('menuitem', {
          name: RoleLabels[USER_ROLE_NAME],
        });

        await fireEvent.click(userRoleButton);

        const confirmButton = await wrapper.getByRole('button', {
          name: 'Continue',
        });
        await fireEvent.click(confirmButton);
        expect(mockAssignUserRole).toHaveBeenCalledWith(
          user.id,
          USER_ROLE_NAME,
        );
      });
    });
    describe('cancel confirmation', () => {
      it('should not assign new role', async () => {
        const user = {
          id: faker.string.uuid(),
          displayName: faker.person.fullName(),
          roles: [],
          effectiveRole: ADMIN_ROLE_NAME,
        };
        const wrapper = await wrappedRender({ user });

        const roleButton = await wrapper.getByRole('button', {
          name: `Role ${RoleLabels[ADMIN_ROLE_NAME]}`,
        });
        await fireEvent.click(roleButton);
        const userRoleButton = await wrapper.getByRole('menuitem', {
          name: RoleLabels[USER_ROLE_NAME],
        });

        await fireEvent.click(userRoleButton);

        const cancelButton = await wrapper.getByRole('button', {
          name: 'Cancel',
        });
        await fireEvent.click(cancelButton);
        expect(mockAssignUserRole).not.toHaveBeenCalled();
      });
    });
  });
});
