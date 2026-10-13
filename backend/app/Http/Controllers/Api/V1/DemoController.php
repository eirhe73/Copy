<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Support\Result;

class DemoController extends Controller
{
    /**
     * 基层转诊演示流程（§3.1，配置类，对齐 grassroots-demo.json 三步链）
     */
    public function transferSteps(): array
    {
        return Result::success('获取成功', [
            'title' => '演示场景：威远 → 上级协同',
            'notice' => 'Mock 流程演示',
            'transferDemo' => ['patientName' => '王秀兰', 'badge' => '演示 · 县域上转待接收'],
            'steps' => [
                ['id' => 'uplink', 'label' => '下级上报', 'detail' => '连界镇 → 威远县 ICU', 'href' => '/#/critical', 'gisHref' => '/gis-command.html?region=weiyuan&focus=wy-02'],
                ['id' => 'consult', 'label' => '县院会诊', 'detail' => '胸痛 · 任务 120-WY-88421', 'href' => '/#/consultations', 'gisHref' => '/gis-command.html?region=weiyuan&focus=wy-01'],
                ['id' => 'transfer', 'label' => '转诊上行', 'detail' => '威远县 → 大方 · 上级协同接收', 'href' => '/#/transfers', 'gisHref' => '/gis-command.html?region=dafang&focus=df-01'],
            ],
        ]);
    }
}
