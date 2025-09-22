import { getContext, extension_settings } from '../../../../extensions.js';
import { callGenericPopup } from '../../../../popup.js';
import { saveSettingsDebounced, substituteParams } from '../../../../../script.js';

const context = getContext();



export const utils = {


    callConfirmPopup() {
        const CONFIRM_POPUP_UI = `
            <div class="inline-drawer">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <label>请确认是否执行当前操作</label>
                </div>
            </div>
            `;

        
        const isConfirmed = callGenericPopup(CONFIRM_POPUP_UI, context.POPUP_TYPE.CONFIRM, "", { okButton: true, cancelButton: false });

        return isConfirmed;
    },

    generateUniqueName(prefix, suffix) {
        const timestamp = Date.now();
        return `${prefix}${timestamp}${suffix}`;
    },

    /**
     * 重置API配置的选项框——让选项框的选项与内部记录的选项名称保持一致
     * @returns void
     */
    reloadApiProfilesSelectOptions(apiProfiles, apiProfilesSelectElement) {

        $(`#${apiProfilesSelectElement}`).empty();
        if (apiProfiles) {
            Object.entries(apiProfiles).forEach(([profileId, profileData], index) => {
                $(`#${apiProfilesSelectElement}`).append(`<option id="${profileId}">${apiProfiles[profileId].apiProfilesName}</option>`);
            });
        }
    },



    async sendApiRequest(apiEndpoint, apiKey, requestData) {
        if (apiEndpoint == '') {
            console.log('API endpoint is required');
            toastr.error('API endpoint is required');
            return
        }
        if (apiKey == '') {
            console.log('API key is required');
            toastr.error('API key is required');
            return
        }
        if (requestData.model == '') {
            console.log('Model name is required');
            toastr.error('Model name is required');
            return
        }
        Object.entries(requestData.messages).forEach(([profileId], index) => {
            console.log('API提示词——role:', requestData.messages[profileId].role);
            console.log('API提示词——content:\n', requestData.messages[profileId].content);
        });
        console.log('向API发送数据:\n', requestData);
        // 使用fetch发送POST请求
        return fetch(apiEndpoint, {
            method: 'POST',  // 请求方法
            headers: {
                'Content-Type': 'application/json',  // 声明发送JSON数据
                'Authorization': `Bearer ${apiKey}`  // 认证头
            },
            body: JSON.stringify(requestData)  // 将JS对象转为JSON字符串
        })

            // 检查HTTP状态
            .then(response => {

                if (!response.ok) {
                    throw new Error(`HTTP错误! 状态码: ${response.status}`);
                }
                return response.json();  // 将响应体解析为JSON
            })

            // 处理响应数据
            .then(data => {

                console.log('完整响应:', data);

                // 提取AI回复内容
                const reply = data.choices[0].message.content;
                console.log('AI回复:', reply);

                return reply;

            })

            // 错误处理
            .catch(error => {

                console.error('请求失败:', error);

            });

    },





    // 添加一个全局变量来跟踪活动请求
    activeStreamRequests: new Map(),

    async sendApiStreamRequest(apiEndpoint, apiKey, requestData, containerElement, requestId = null) {

        let fullContent = '';
        // 生成或使用提供的请求ID
        const streamId = requestId || Date.now().toString();

        // 存储取消函数
        let abortController = new AbortController();
        this.activeStreamRequests.set(streamId, abortController);


        if (apiEndpoint == '') {
            console.log('API endpoint is required');
            toastr.error('API endpoint is required');
            return;
        }
        if (apiKey == '') {
            console.log('API key is required');
            toastr.error('API key is required');
            return;
        }
        if (requestData.model == '') {
            console.log('Model name is required');
            toastr.error('Model name is required');
            return;
        }

        // 打印提示词信息
        Object.entries(requestData.messages).forEach(([profileId], index) => {
            console.log('API提示词——role:', requestData.messages[profileId].role);
            console.log('API提示词——content:\n', requestData.messages[profileId].content);
        });
        console.log('向API发送数据:\n', requestData);
        console.log('流式传输开始');
        try {
            // 添加流式传输参数
            const streamRequestData = {
                ...requestData,
                stream: true  // 启用流式传输
            };

            // 使用fetch发送POST请求
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(streamRequestData),
                signal: abortController.signal  // 添加这一行以支持中断
            });

            if (!response.ok) {
                throw new Error(`HTTP错误! 状态码: ${response.status}`);
            }

            // 处理流式响应
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            

            while (true) {

                // 检查是否请求被取消
                if (abortController.signal.aborted) {
                    console.log('流式传输被用户中断');
                    break;
                }

                const { done, value } = await reader.read();

                if (done) {
                    console.log('流式传输完成');
                    break;
                }

                // 解码并处理数据块
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                        try {
                            const jsonData = JSON.parse(line.slice(6)); // 移除 "data: " 前缀

                            if (jsonData.choices && jsonData.choices[0].delta && jsonData.choices[0].delta.content) {
                                const content = jsonData.choices[0].delta.content;
                                fullContent += content;

                                // 确保容器元素有效
                                if (!containerElement || !(containerElement instanceof HTMLElement)) {
                                    console.error('无效的容器元素');
                                    // 创建临时容器用于调试
                                    containerElement = document.createElement('div');
                                    document.body.appendChild(containerElement);
                                    console.log('创建调试容器:', containerElement);
                                }


                                // 实时更新容器内容
                                if (containerElement) {
                                    containerElement.innerHTML += content;
                                    // 自动滚动到底部
                                    containerElement.scrollTop = containerElement.scrollHeight;
                                }
                            }
                        } catch (e) {
                            // 忽略解析错误（可能是部分数据）
                            console.log('解析数据块时出错:', e, '原始数据:', line);
                        }
                    }
                }
            }

            console.log('完整回复:', fullContent);
            // 请求完成后从活动请求映射中移除
            this.activeStreamRequests.delete(streamId);
            return fullContent;

        } catch (error) {
            // 检查是否是中止错误
            if (error.name === 'AbortError') {
                console.log('请求已被用户中止');
                // 请求完成后从活动请求映射中移除
                this.activeStreamRequests.delete(streamId);
                return fullContent || ''; // 返回已接收的部分内容
            }

            console.error('请求失败:', error);
            toastr.error('API请求失败: ' + error.message);
            // 请求完成后从活动请求映射中移除
            this.activeStreamRequests.delete(streamId);
            throw error;
        }
    },


    // 添加取消流式传输的方法
    cancelStreamRequest(requestId) {
        if (this.activeStreamRequests.has(requestId)) {
            this.activeStreamRequests.get(requestId).abort();
            this.activeStreamRequests.delete(requestId);
            console.log(`已取消请求: ${requestId}`);
            return true;
        }
        console.log(`未找到活动请求: ${requestId}`);
        return false;
    },

    // 取消所有活动请求
    cancelAllStreamRequests() {
        this.activeStreamRequests.forEach((controller, id) => {
            controller.abort();
            console.log(`已取消请求: ${id}`);
        });
        this.activeStreamRequests.clear();
    }


};



