// 导入Sillytavern的工具
import { saveSettingsDebounced, extension_prompts, chat_metadata } from '../../../../script.js';
import { callGenericPopup } from '../../../popup.js';
import { getContext, extension_settings } from '../../../extensions.js';
import { MacrosParser } from '../../../macros.js';

import { editApiProfile } from './src/editApiProfile.js';
import { editSummaryChatHistory } from './src/summarizeChatHistory.js';
import { utils } from './src/utils.js';

export const context = getContext();
/**
 * 初始化API配置属性：extension_settings.XKaRZ_Extension.summaryChatHistory
 * @returns void
 */
(function initializeXKaRZExtension() {
    if (typeof extension_settings === 'undefined') {
        console.error('extension_settings is not initialized');
        return;
    }
    if (!extension_settings.XKaRZ_Extension) {
        extension_settings.XKaRZ_Extension = {};
    }
    if (!extension_settings.XKaRZ_Extension.summaryChatHistory) {
        extension_settings.XKaRZ_Extension.summaryChatHistory = {
            selectedApiConfig: {
                apiProfilesId: '',
                apiProfilesName: '',
                apiEndpoint: '',
                apiKey: '',
                apiModelName: '',
                temperature: 0.7,
            },
            isAutoSummaryChat: false,
            isShowGenerateChatSummaryButton: false,
            isSummarizeSameMessages: false,
            isSummarizeUserMessages: false,
            isAddUserMessagesToPrompts: false,
            messageIdWithOffset: 0,
            messageIdWithDoubleOffset: 0,
            promptContextMessageIdWithOffset: -2,
        };
    }

    if (!extension_settings.XKaRZ_Extension.apiProfiles) {
        extension_settings.XKaRZ_Extension.apiProfiles = {};
        let uniqueApiProfilesName = utils.generateUniqueName('API Profiles', '');
        extension_settings.XKaRZ_Extension.apiProfiles[uniqueApiProfilesName] = {
            apiProfilesName: `${uniqueApiProfilesName}`,
            apiEndpoint: '',
            apiKey: '',
            apiModelName: '',

        };

    }
    if (!extension_settings.XKaRZ_Extension.promptProfiles) {
        extension_settings.XKaRZ_Extension.promptProfiles = {};
        let uniquePromptProfilesName = utils.generateUniqueName('API Profiles', '');
        extension_settings.XKaRZ_Extension.apiProfiles[uniquePromptProfilesName] = {
            apiProfilesName: `${uniquePromptProfilesName}`,
            apiEndpoint: '',
            apiKey: '',
            apiModelName: '',

        };

    }

    saveSettingsDebounced();
})();
export const apiProfiles = extension_settings.XKaRZ_Extension.apiProfiles;
export const summaryChatHistory = extension_settings.XKaRZ_Extension.summaryChatHistory;

jQuery(async () => {


    const XKaRZ_EXTENSION_SETTINGS_UI = `
    <div class="inline-drawer">
        <div class="inline-drawer-toggle inline-drawer-header">
            <b>XKaRZ Extension Settings</b>
            <div class="inline-drawer-icon fa-solid fa-circle-chevron-down"></div>
        </div>
        <div class="inline-drawer-content " id="XKaRZ_extension_settings_ui">



        </div>
    </div>
    `;


    // 加载设置页面Main_Setting_HTML，插入到主设置区域。
    $("#extensions_settings2").append(XKaRZ_EXTENSION_SETTINGS_UI);


    editApiProfile();
    editSummaryChatHistory();




});





