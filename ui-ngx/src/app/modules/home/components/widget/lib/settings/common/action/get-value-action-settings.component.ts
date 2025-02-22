///
/// Copyright © 2016-2024 The Thingsboard Authors
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///     http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

import {
  ChangeDetectorRef,
  Component,
  forwardRef,
  HostBinding,
  Input,
  OnInit,
  Renderer2,
  ViewContainerRef,
  ViewEncapsulation
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { TbPopoverService } from '@shared/components/popover.service';
import { GetValueAction, GetValueSettings } from '@shared/models/action-widget-settings.models';
import { TranslateService } from '@ngx-translate/core';
import { ValueType } from '@shared/models/constants';
import {
  GetValueActionSettingsPanelComponent
} from '@home/components/widget/lib/settings/common/action/get-value-action-settings-panel.component';
import { IAliasController } from '@core/api/widget-api.models';
import { TargetDevice } from '@shared/models/widget.models';

@Component({
  selector: 'tb-get-value-action-settings',
  templateUrl: './value-action-settings-button.component.html',
  styleUrls: ['./value-action-settings-button.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => GetValueActionSettingsComponent),
      multi: true
    }
  ],
  encapsulation: ViewEncapsulation.None
})
export class GetValueActionSettingsComponent implements OnInit, ControlValueAccessor {

  @HostBinding('style.overflow')
  overflow = 'hidden';

  @Input()
  panelTitle: string;

  @Input()
  valueType: ValueType;

  @Input()
  aliasController: IAliasController;

  @Input()
  targetDevice: TargetDevice;

  @Input()
  disabled = false;

  modelValue: GetValueSettings<any>;

  displayValue: string;

  private propagateChange = null;

  constructor(private translate: TranslateService,
              private popoverService: TbPopoverService,
              private renderer: Renderer2,
              private viewContainerRef: ViewContainerRef,
              private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(_fn: any): void {
  }

  setDisabledState(isDisabled: boolean): void {
    if (this.disabled !== isDisabled) {
      this.disabled = isDisabled;
    }
  }

  writeValue(value: GetValueSettings<any>): void {
    this.modelValue = value;
    this.updateDisplayValue();
  }

  openValueActionSettingsPopup($event: Event, matButton: MatButton) {
    if ($event) {
      $event.stopPropagation();
    }
    const trigger = matButton._elementRef.nativeElement;
    if (this.popoverService.hasPopover(trigger)) {
      this.popoverService.hidePopover(trigger);
    } else {
      const ctx: any = {
        getValueSettings: this.modelValue,
        panelTitle: this.panelTitle,
        valueType: this.valueType,
        aliasController: this.aliasController,
        targetDevice: this.targetDevice
      };
      const getValueSettingsPanelPopover = this.popoverService.displayPopover(trigger, this.renderer,
        this.viewContainerRef, GetValueActionSettingsPanelComponent,
        ['leftTopOnly', 'leftOnly', 'leftBottomOnly'], true, null,
        ctx,
        {},
        {}, {}, true);
      getValueSettingsPanelPopover.tbComponentRef.instance.popover = getValueSettingsPanelPopover;
      getValueSettingsPanelPopover.tbComponentRef.instance.getValueSettingsApplied.subscribe((getValueSettings) => {
        getValueSettingsPanelPopover.hide();
        this.modelValue = getValueSettings;
        this.updateDisplayValue();
        this.propagateChange(this.modelValue);
      });
    }
  }

  private updateDisplayValue() {
    switch (this.modelValue.action) {
      case GetValueAction.DO_NOTHING:
        if (this.valueType === ValueType.BOOLEAN) {
          this.displayValue = this.translate.instant(!!this.modelValue.defaultValue ? 'widgets.value-action.on' : 'widgets.value-action.off');
        } else {
          this.displayValue = this.modelValue.defaultValue + '';
        }
        break;
      case GetValueAction.EXECUTE_RPC:
        const methodName = this.modelValue.executeRpc.method;
        this.displayValue = this.translate.instant('widgets.value-action.execute-rpc-text', {methodName});
        break;
      case GetValueAction.GET_ATTRIBUTE:
        this.displayValue = this.translate.instant('widgets.value-action.get-attribute-text', {key: this.modelValue.getAttribute.key});
        break;
      case GetValueAction.GET_TIME_SERIES:
        this.displayValue = this.translate.instant('widgets.value-action.get-time-series-text', {key: this.modelValue.getTimeSeries.key});
        break;
    }
    this.cd.markForCheck();
  }

}
