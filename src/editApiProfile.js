import { getContext, extension_settings } from '../../../../extensions.js';
import { callGenericPopup } from '../../../../popup.js';
import { saveSettingsDebounced, substituteParams } from '../../../../../script.js';

import { utils } from './utils.js';
import { apiProfiles, context } from '../index.js';




// <========================================================主函数========================================================>
export function editApiProfile() {

    // <========================================================UI常量声明========================================================>

    const EDIT_API_PROFILES_BUTTON = `
        <div class="flex-container justifyspacebetween alignitemscenter" id="">
            <button id="open_edit_api_profiles_button" class="menu_button interactable extensions-settings-button" title="Edit API Profile" tabindex="0">Edit API Profile</button>
        </div>
    `;

    // </========================================================UI常量声明声明========================================================>
    // <========================================================一级工具函数========================================================>
    function openEditApiProfilesDialog() {

        // <========================================================UI常量声明========================================================>

        const EDIT_API_PROFILES_UI = `
            <div class="container" id="edit_api_profiles_ui">

                <div class="header">
                    <h1><i class="fas fa-table"></i>Edit API Profiles</h1>
                </div>

                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <label id="">API Profiles Select:</label>
                </div>

                <div class="flex-container justifyspacebetween alignitemscenter" id="">
                    <select id="api_profiles_select" class="">
                        <option>Chose API Profiles</option>
                    </select>
                    <button id="delete_profiles_button" class="menu_button fa-solid fa-trash-can interactable" title="Delete API Profiles" tabindex="0"></button>
                </div>

                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <label id="">API Profiles Name:</label>
                </div>
                <input type="text" id="api_profiles_name_input" class="text_pole" />

                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <label id="">API Endpoint:</label>
                </div>
                <input type="text" id="api_endpoint_input" class="text_pole" />

                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <label id="">API Key:</label>
                </div>
                <input type="password" id="api_key_input" class="text_pole" />


                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <label id="">Model Name:</label>
                </div>
                <input type="text" id="model_name_input" class="text_pole" />

                <div class="flex-container gap10">

                    <button id="save_profiles_button" class="menu_button">Save Profiles</button>

                    <button id="create_profiles_button" class="menu_button">Create Profiles</button>

                    <button id="test_message_button" class="menu_button">Test Message</button>
                </div>
            </div>
    `;

        // </========================================================UI常量声明声明========================================================>
        // <========================================================工具函数声明========================================================>
        /**
         * 将所选的API配置内容加载到内容框中
         * @returns void
         */
        function loadApiProfilesToInputs() {
            $('#api_profiles_name_input').val(apiProfiles[$("#api_profiles_select option:selected").attr("id")].apiProfilesName);
            $('#api_endpoint_input').val(apiProfiles[$("#api_profiles_select option:selected").attr("id")].apiEndpoint);
            $('#api_key_input').val(apiProfiles[$("#api_profiles_select option:selected").attr("id")].apiKey);
            $('#model_name_input').val(apiProfiles[$("#api_profiles_select option:selected").attr("id")].apiModelName);
        }

        /**
         * 保持API配置至少有一个
         * @returns void
         */
        function ensureProfilesExist() {
            if (extension_settings.XKaRZ_Extension.apiProfiles) {

                if (Object.keys(apiProfiles).length === 0) {
                    let uniqueApiProfilesName = utils.generateUniqueName('API Profiles', '');
                    apiProfiles[uniqueApiProfilesName] = {
                        apiProfilesName: `${uniqueApiProfilesName}`,
                        apiEndpoint: '',
                        apiKey: '',
                        apiModelName: '',
                    }
                    saveSettingsDebounced();
                }
            }
        }
        // </========================================================工具函数声明========================================================>
        // <========================================================事件处理函数声明========================================================>
        function handleApiProfilesSettingsClick(event) {
            const $target = $(event.target);

            async function handleProfileSelect() {
                loadApiProfilesToInputs();
            }
            async function handleSaveProfiles() {
                let cachedApiProfilesId = $("#api_profiles_select option:selected").attr("id");
                apiProfiles[$("#api_profiles_select option:selected").attr("id")].apiProfilesName = $('#api_profiles_name_input').val();
                apiProfiles[$("#api_profiles_select option:selected").attr("id")].apiEndpoint = $('#api_endpoint_input').val();
                apiProfiles[$("#api_profiles_select option:selected").attr("id")].apiKey = $('#api_key_input').val();
                apiProfiles[$("#api_profiles_select option:selected").attr("id")].apiModelName = $('#model_name_input').val();
                saveSettingsDebounced();
                ensureProfilesExist();
                utils.reloadApiProfilesSelectOptions(apiProfiles, "api_profiles_select");
                $(`#api_profiles_select option[id='${cachedApiProfilesId}']`).prop("selected", true);
                loadApiProfilesToInputs();
                toastr.info('Saved successfully!');
            }
            async function handleCreateProfiles() {
                // 使用示例
                let uniqueApiProfilesName = await utils.generateUniqueName('API Profiles', '');
                apiProfiles[uniqueApiProfilesName] = {
                    apiProfilesName: `${uniqueApiProfilesName}`,
                    apiEndpoint: '',
                    apiKey: '',
                    apiModelName: '',
                }
                saveSettingsDebounced();
                ensureProfilesExist();
                utils.reloadApiProfilesSelectOptions(apiProfiles, "api_profiles_select");
                $(`#api_profiles_select option[id='${uniqueApiProfilesName}']`).prop("selected", true);
                loadApiProfilesToInputs();

                toastr.info('Created successfully!');
            }
            async function handleDeleteProfiles() {
                // 删除当前选择的API配置
                const isConfirm = await utils.callConfirmPopup();
                if (isConfirm) {
                    if (apiProfiles[$("#api_profiles_select option:selected").attr("id")]) {
                        delete apiProfiles[$("#api_profiles_select option:selected").attr("id")];
                    }
                    $('#api_profiles_select option:selected').remove();
                    toastr.info('deleted successfully!');
                    saveSettingsDebounced();
                }
                ensureProfilesExist();
                utils.reloadApiProfilesSelectOptions(apiProfiles, "api_profiles_select");
                loadApiProfilesToInputs();
            }
            async function handleTestMessage() {
                let cachedApiEndpoint = $('#api_endpoint_input').val();
                let cachedApiKey = $('#api_key_input').val();
                let cachedApiModelName = $('#model_name_input').val();
                let requestData = {
                    model: cachedApiModelName,
                    messages: [
                        {
                            content: 'reply me "OK"',
                            role: "user",
                        }
                    ],
                    temperature: 0.7,
                }
                let cachedReply = await utils.sendApiRequest(cachedApiEndpoint, cachedApiKey, requestData);
                toastr.info(cachedReply);
            }

            if ($target.closest('#api_profiles_select').length) {
                handleProfileSelect();
                return;
            }

            if ($target.closest('#save_profiles_button').length) {
                handleSaveProfiles();
                return;
            }

            if ($target.closest('#create_profiles_button').length) {
                handleCreateProfiles();
                return;
            }

            if ($target.closest('#delete_profiles_button').length) {
                handleDeleteProfiles();
                return;
            }

            if ($target.closest('#test_message_button').length) {
                handleTestMessage();
                return;
            }

        }
        // </========================================================事件处理函数声明========================================================>

        // </========================================================主逻辑========================================================>
        callGenericPopup(EDIT_API_PROFILES_UI, context.POPUP_TYPE.DISPLAY, "", { rows: 10, wider: true });
        ensureProfilesExist();
        utils.reloadApiProfilesSelectOptions(apiProfiles, "api_profiles_select");
        loadApiProfilesToInputs();
        // </========================================================主逻辑========================================================>


        // <========================================================事件监听器========================================================>
        $('#edit_api_profiles_ui').on('click', handleApiProfilesSettingsClick);

        // </========================================================事件监听器========================================================>
    }
    // </========================================================一级工具函数========================================================>

    $("#XKaRZ_extension_settings_ui").append(EDIT_API_PROFILES_BUTTON);


    $('#open_edit_api_profiles_button').on('click', openEditApiProfilesDialog);
}
// </========================================================主函数========================================================>


