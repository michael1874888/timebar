/**
 * TimeBar - Layers 統一入口
 *
 * 四層架構入口點
 * - Layer 1 (Data): 數據存取
 * - Layer 2 (Domain): 領域邏輯
 * - Layer 3 (Business): 業務邏輯
 * - Layer 4 (UI): 用戶界面
 */

// 需要時可以直接從 @data、@domain、@business、@ui 引入
// 這個入口用於需要跨層引用的特殊情況

export * as Data from './1-data';
export * as Domain from './2-domain';
export * as Business from './3-business';
export * as UI from './4-ui';
