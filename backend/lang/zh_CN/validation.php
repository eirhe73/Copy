<?php

/*
|--------------------------------------------------------------------------
| 校验错误提示（简体中文）
|--------------------------------------------------------------------------
|
| 说明：本项目 config/app.php 的 locale 已切换为 zh_CN，这里提供中文提示模板。
| fallback_locale 仍为 en：本文件未覆盖的键会回退到框架自带英文文案，不会报错。
|
| 字段名由各 FormRequest 的 attributes() 提供（已是中文），
| 所以这里只需翻译模板本身；个别需要整句重写的规则放在 custom 里。
|
*/

return [

    /*
    |--------------------------------------------------------------------------
    | 通用校验规则
    |--------------------------------------------------------------------------
    */

    'accepted' => ':attribute 必须接受。',
    'accepted_if' => '当 :other 为 :value 时， :attribute 必须接受。',
    'active_url' => ':attribute 不是一个有效的网址。',
    'after' => ':attribute 必须是一个晚于 :date 的时间。',
    'after_or_equal' => ':attribute 必须是一个晚于或等于 :date 的时间。',
    'alpha' => ':attribute 只能由字母组成。',
    'alpha_dash' => ':attribute 只能由字母、数字、短横线和下划线组成。',
    'alpha_num' => ':attribute 只能由字母和数字组成。',
    'array' => ':attribute 必须是一个数组。',
    'ascii' => ':attribute 只能包含单字节的字母、数字和符号。',
    'before' => ':attribute 必须是一个早于 :date 的时间。',
    'before_or_equal' => ':attribute 必须是一个早于或等于 :date 的时间。',
    'between' => [
        'array' => ':attribute 只能有 :min - :max 个元素。',
        'file' => ':attribute 的大小必须在 :min - :max KB 之间。',
        'numeric' => ':attribute 的大小必须在 :min - :max 之间。',
        'string' => ':attribute 的长度必须在 :min - :max 个字符之间。',
    ],
    'boolean' => ':attribute 字段必须为 true 或 false。',
    'confirmed' => ':attribute 两次输入不一致。',
    'current_password' => '密码错误。',
    'date' => ':attribute 不是一个有效的日期。',
    'date_equals' => ':attribute 必须等于 :date。',
    'date_format' => ':attribute 的格式必须为 :format。',
    'decimal' => ':attribute 必须有 :decimal 位小数。',
    'declined' => ':attribute 必须拒绝。',
    'declined_if' => '当 :other 为 :value 时， :attribute 必须拒绝。',
    'different' => ':attribute 和 :other 必须不同。',
    'digits' => ':attribute 必须是 :digits 位的数字。',
    'digits_between' => ':attribute 必须是 :min 位到 :max 位的数字。',
    'dimensions' => ':attribute 图片尺寸不合法。',
    'distinct' => ':attribute 已经存在。',
    'doesnt_end_with' => ':attribute 结尾不能是以下之一：:values。',
    'doesnt_start_with' => ':attribute 开头不能是以下之一：:values。',
    'email' => ':attribute 不是一个合法的邮箱地址。',
    'ends_with' => ':attribute 结尾必须为以下之一：:values。',
    'enum' => '所选的 :attribute 无效。',
    'exists' => '所选的 :attribute 无效。',
    'file' => ':attribute 必须是一个文件。',
    'filled' => ':attribute 字段不能为空。',
    'gt' => [
        'array' => ':attribute 只能有大于 :value 个元素。',
        'file' => ':attribute 的大小必须大于 :value KB。',
        'numeric' => ':attribute 的大小必须大于 :value。',
        'string' => ':attribute 的长度必须大于 :value 个字符。',
    ],
    'gte' => [
        'array' => ':attribute 至少有 :value 个元素。',
        'file' => ':attribute 的大小必须大于或等于 :value KB。',
        'numeric' => ':attribute 的大小必须大于或等于 :value。',
        'string' => ':attribute 的长度必须大于或等于 :value 个字符。',
    ],
    'image' => ':attribute 必须是一张图片。',
    'in' => '所选的 :attribute 无效。',
    'in_array' => ':attribute 不在 :other 中。',
    'integer' => ':attribute 必须是一个整数。',
    'ip' => ':attribute 必须是一个有效的 IP 地址。',
    'ipv4' => ':attribute 必须是一个有效的 IPv4 地址。',
    'ipv6' => ':attribute 必须是一个有效的 IPv6 地址。',
    'json' => ':attribute 必须是一个合法的 JSON 字符串。',
    'lowercase' => ':attribute 必须为小写。',
    'lt' => [
        'array' => ':attribute 只能有小于 :value 个元素。',
        'file' => ':attribute 的大小必须小于 :value KB。',
        'numeric' => ':attribute 的大小必须小于 :value。',
        'string' => ':attribute 的长度必须小于 :value 个字符。',
    ],
    'lte' => [
        'array' => ':attribute 最多只能有 :value 个元素。',
        'file' => ':attribute 的大小必须小于或等于 :value KB。',
        'numeric' => ':attribute 的大小必须小于或等于 :value。',
        'string' => ':attribute 的长度必须小于或等于 :value 个字符。',
    ],
    'mac_address' => ':attribute 必须是一个有效的 MAC 地址。',
    'max' => [
        'array' => ':attribute 最多只能有 :max 个元素。',
        'file' => ':attribute 的大小不能大于 :max KB。',
        'numeric' => ':attribute 的大小不能大于 :max。',
        'string' => ':attribute 的长度不能大于 :max 个字符。',
    ],
    'max_digits' => ':attribute 不能超过 :max 位数字。',
    'mimes' => ':attribute 必须是一个符合以下类型的文件：:values。',
    'mimetypes' => ':attribute 必须是一个符合以下类型的文件：:values。',
    'min' => [
        'array' => ':attribute 至少有 :min 个元素。',
        'file' => ':attribute 的大小不能小于 :min KB。',
        'numeric' => ':attribute 的大小不能小于 :min。',
        'string' => ':attribute 的长度不能小于 :min 个字符。',
    ],
    'min_digits' => ':attribute 必须至少有 :min 位数字。',
    'multiple_of' => ':attribute 必须是 :value 的倍数。',
    'not_in' => '所选的 :attribute 无效。',
    'not_regex' => ':attribute 的格式不合法。',
    'numeric' => ':attribute 必须是一个数字。',
    'password' => [
        'letters' => ':attribute 必须包含至少一个字母。',
        'mixed' => ':attribute 必须包含至少一个大写字母和一个小写字母。',
        'numbers' => ':attribute 必须包含至少一个数字。',
        'symbols' => ':attribute 必须包含至少一个符号。',
        'uncompromised' => '给定的 :attribute 已出现在数据泄露中，请更换一个。',
    ],
    'present' => ':attribute 字段必须存在。',
    'prohibited' => ':attribute 字段禁止填写。',
    'prohibited_if' => '当 :other 为 :value 时， :attribute 字段禁止填写。',
    'prohibited_unless' => '当 :other 不在 :values 中时， :attribute 字段禁止填写。',
    'prohibits' => ':attribute 字段存在时，禁止 :other 字段填写。',
    'regex' => ':attribute 的格式不合法。',
    'required' => ':attribute 字段是必须的。',
    'required_array_keys' => ':attribute 字段必须包含以下条目：:values。',
    'required_if' => '当 :other 为 :value 时， :attribute 字段是必须的。',
    'required_if_accepted' => '当 :other 被接受时， :attribute 字段是必须的。',
    'required_unless' => '除非 :other 在 :values 中，否则 :attribute 字段是必须的。',
    'required_with' => '当 :values 存在时， :attribute 字段是必须的。',
    'required_with_all' => '当 :values 存在时， :attribute 字段是必须的。',
    'required_without' => '当 :values 不存在时， :attribute 字段是必须的。',
    'required_without_all' => '当 :values 都不存在时， :attribute 字段是必须的。',
    'same' => ':attribute 和 :other 必须相同。',
    'size' => [
        'array' => ':attribute 必须包含 :size 个元素。',
        'file' => ':attribute 的大小必须为 :size KB。',
        'numeric' => ':attribute 的大小必须为 :size。',
        'string' => ':attribute 的长度必须为 :size 个字符。',
    ],
    'starts_with' => ':attribute 开头必须为以下之一：:values。',
    'string' => ':attribute 必须是一个字符串。',
    'timezone' => ':attribute 必须是一个有效的时区。',
    'unique' => ':attribute 已经存在。',
    'uploaded' => ':attribute 上传失败。',
    'uppercase' => ':attribute 必须为大写。',
    'url' => ':attribute 不是一个有效的网址。',
    'uuid' => ':attribute 必须是一个有效的 UUID。',

    /*
    |--------------------------------------------------------------------------
    | 项目自定义整句提示
    |--------------------------------------------------------------------------
    |
    | 键为请求里的字段名（不是 attributes() 里的中文名），用于把提示写成完整句子。
    |
    */

    'custom' => [
        'scheduledAt' => [
            'after' => '定时开始时间必须晚于当前时间',
            'date' => '定时开始时间不是一个有效的时间',
        ],
        'gender' => [
            'in' => '性别只能是 MALE（男）、FEMALE（女）或 UNKNOWN（未知）',
        ],
        'targetHospital' => [
            'required' => '请选择接诊医院',
        ],
        'targetDepartment' => [
            'required' => '请选择接诊科室',
        ],
        'patientName' => [
            'required_without' => '请选择患者或填写患者姓名',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | 自定义属性名（兜底）
    |--------------------------------------------------------------------------
    |
    | 各 FormRequest 已通过 attributes() 提供中文名，这里只放公共接口的兜底映射。
    |
    */

    'attributes' => [
        'email' => '邮箱',
        'password' => '密码',
        'username' => '登录账号',
        'name' => '名称',
        'phone' => '手机号',
    ],

];
