import { Injectable } from '@nestjs/common';
import type {
  ResolveScope,
  SettingField,
  SettingGroup,
  SettingSection,
  SettingsCatalog,
} from '@sanad/contracts';
import { SETTINGS_DEFAULTS } from './branding-catalog.js';
import type { ResolvedValue } from './resolved-value.js';
import {
  SETTING_DESCRIPTORS,
  type SettingDescriptor,
} from './settings-catalog.descriptors.js';
import { SettingsResolver } from './settings.resolver.js';

/**
 * Assembles the descriptor-driven settings catalog for the admin (groups → sections →
 * fields), pairing each descriptor with its current RESOLVED value (override → global →
 * coded default, U9 — never blank, F7). Read-only: structure from the code catalog,
 * values from the resolver.
 */
@Injectable()
export class SettingsCatalogService {
  constructor(private readonly resolver: SettingsResolver) {}

  async getCatalog(ctx: ResolveScope): Promise<SettingsCatalog> {
    const groupIds = [...new Set(SETTING_DESCRIPTORS.map((d) => d.group))];
    const groups: SettingGroup[] = [];
    for (const group of groupIds) {
      const resolved = await this.resolver.resolveGroup(group, ctx);
      const descriptors = SETTING_DESCRIPTORS.filter((d) => d.group === group);
      groups.push({ group, sections: this.toSections(descriptors, resolved) });
    }
    return { groups };
  }

  private toSections(
    descriptors: readonly SettingDescriptor[],
    resolved: Readonly<Record<string, ResolvedValue>>,
  ): SettingSection[] {
    const order: string[] = [];
    const bySection = new Map<string, SettingField[]>();
    for (const descriptor of descriptors) {
      let fields = bySection.get(descriptor.section);
      if (!fields) {
        fields = [];
        bySection.set(descriptor.section, fields);
        order.push(descriptor.section);
      }
      fields.push({
        key: descriptor.key,
        type: descriptor.type,
        requirement: descriptor.requirement,
        ...(descriptor.options ? { options: descriptor.options } : {}),
        value:
          resolved[descriptor.key] ?? SETTINGS_DEFAULTS[descriptor.key] ?? null,
      });
    }
    return order.map((section) => ({
      section,
      fields: bySection.get(section) ?? [],
    }));
  }
}
