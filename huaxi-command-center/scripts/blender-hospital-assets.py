# -*- coding: utf-8 -*-
"""
============================================================
 县域急危重症救治指挥平台 · 医院「院区」低模生成器（Blender）
============================================================
生成目标：看起来像真实县级/乡镇医院的「楼群院区」，而非单栋楼。
  - 多栋楼：门诊楼 + 住院楼 + 急诊楼 + 医技楼 + 行政楼（按 tier 增减）
  - 绿化：草皮地面 + 成排/散落树木（低模树干+树冠）
  - 道路/停车场、入口标识、屋顶设备、雨棚、红十字
  - 上色：数字孪生/指挥台 cyber 主题（深蓝体量 + 青色发光窗带 + 边缘光）
    与 huaxi-command-center 地图 (#0f172a / #1d4ed8 / #67e8f9) 融合，像「从地图上长出来」符号

运行方式：
  1) Blender 打开任意场景 → Scripting/Text Editor 打开本文件 → Run Script
  2) 无头命令行（产出落盘到本脚本旁 exports/）：
     blender --background --python blender-hospital-assets.py

只导出其中一套：EXPORT_ONLY = "TIER0"/"TIER1"/"TIER2"/"FLAGSHIP"，None=全部。

业务映射（建模一次，按 tier 复用缩放即可）：
  大方县：df-01 县城接收 / df-02 凤山 / df-03 达溪 → TIER0
          df-04 鼎新 / df-05 核桃 / df-06 黄泥塘     → TIER1
          df-07 理化 / df-08 雨冲                    → TIER2
  威远县：wy-01 威远县人民医院                     → TIER0
          wy-02 连界镇 / wy-03 新店镇               → TIER1
          wy-04 船石村                              → TIER2
          huaxi 协作上级                            → FLAGSHIP
============================================================
"""

import bpy
import os
import math
from mathutils import Matrix

# ------------------------------------------------------------
# 配置
# ------------------------------------------------------------
EXPORT_ONLY = None            # None=全部；或 "TIER0"/"TIER1"/"TIER2"/"FLAGSHIP"
COLLECTION_NAME = "HospitalAssets"
ADD_GROUND = False            # 草皮/道路/停车（默认关：不加地板，直接落在场景地面上）
ADD_TREES = False             # Web 地图：树会拉偏包围盒锚点
ADD_FENCE = False             # 护栏不导出
JOIN_DECOR = False            # 只合并楼体并 origin 居中

# --- 浅色 GIS 配色（与 mapTheme light / 首页 MapScene 一致，RGB 0~1）---
C_MAP_DEEP   = (0.941, 0.984, 1.0)     # 页面底（近 #f0f9ff）
C_BODY       = (0.431, 0.710, 0.918)     # #6eb5ea 楼体=地图顶面
C_BODY2      = (0.118, 0.294, 0.482)   # #1e4b7b 副楼/裙楼
C_ROOF       = (0.102, 0.267, 0.502)   # #1a4480 屋面
C_EMIT_EDGE  = (0.220, 0.741, 0.973)   # #38bdf8 边界高光
C_EMIT_WIN   = (0.145, 0.388, 0.922)   # #2563eb tier1 窗带
C_EMIT_SOFT  = (0.220, 0.741, 0.973)   # #38bdf8 tier2 标识
C_EMIT_MUTED = (0.118, 0.294, 0.482)   # #1e4b7b tier0/基层
C_EMIT_FLAG  = (0.118, 0.294, 0.482)   # 协作上级（同县级深蓝）
C_TRUNK      = (0.46, 0.33, 0.22)   # 树干棕
C_LEAF       = (0.20, 0.48, 0.20)   # 树叶绿
C_LEAF2      = (0.30, 0.56, 0.26)   # 树叶绿（浅）
C_FENCE      = (0.06, 0.09, 0.14)
# 地面类（仅 ADD_GROUND=True 时用，与地图网格同色）
C_GRASS      = C_MAP_DEEP
C_ROAD       = (0.05, 0.08, 0.14)
C_PATH       = (0.07, 0.11, 0.20)


# ------------------------------------------------------------
# 材质
# ------------------------------------------------------------
def mat(name, color, rough=0.7, transmission=0.0, ior=1.45, metallic=0.0,
        emission=None, emit_strength=0.0):
    m = bpy.data.materials.get(name)
    if m is None:
        m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metallic
    tkey = "Transmission Weight" if "Transmission Weight" in bsdf.inputs else "Transmission"
    if tkey in bsdf.inputs:
        bsdf.inputs[tkey].default_value = transmission
    if "IOR" in bsdf.inputs:
        bsdf.inputs["IOR"].default_value = ior
    emit = emission if emission is not None else color
    if "Emission Color" in bsdf.inputs:
        bsdf.inputs["Emission Color"].default_value = (*emit, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emit_strength
    elif "Emission" in bsdf.inputs:
        bsdf.inputs["Emission"].default_value = (*emit, 1.0)
        if "Emission Strength" in bsdf.inputs:
            bsdf.inputs["Emission Strength"].default_value = emit_strength
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(bsdf.outputs[0], out.inputs[0])
    return m


def make_materials():
    """四套 tier 共用深色楼体；差异在 accent / 窗带发光色（与地图 tier 色一致）。"""
    return {
        "wall": mat(
            "DT_Wall", C_BODY, rough=0.55, metallic=0.12,
            emission=C_EMIT_EDGE, emit_strength=0.06,
        ),
        "wall2": mat(
            "DT_Wall2", C_BODY2, rough=0.50, metallic=0.18,
            emission=C_EMIT_EDGE, emit_strength=0.10,
        ),
        "glass": mat(
            "DT_GlassWin", C_BODY, rough=0.25, metallic=0.05,
            emission=C_EMIT_WIN, emit_strength=2.2,
        ),
        "glassD": mat(
            "DT_GlassDoor", C_MAP_DEEP, rough=0.35, metallic=0.08,
            emission=C_EMIT_SOFT, emit_strength=1.4,
        ),
        "accent": mat(
            "DT_AccentT0", C_BODY2, rough=0.35, metallic=0.25,
            emission=C_EMIT_WIN, emit_strength=2.8,
        ),
        "green": mat(
            "DT_AccentT1", C_BODY, rough=0.35, metallic=0.22,
            emission=C_EMIT_SOFT, emit_strength=2.4,
        ),
        "muted": mat(
            "DT_AccentT2", C_BODY, rough=0.45, metallic=0.10,
            emission=C_EMIT_MUTED, emit_strength=1.2,
        ),
        "flagship": mat(
            "DT_AccentFlag", C_BODY2, rough=0.32, metallic=0.28,
            emission=C_EMIT_FLAG, emit_strength=3.0,
        ),
        "emblem": mat(
            "DT_Emblem", C_MAP_DEEP, rough=0.30, metallic=0.15,
            emission=C_EMIT_EDGE, emit_strength=3.5,
        ),
        "roof": mat(
            "DT_Roof", C_ROOF, rough=0.70, metallic=0.20,
            emission=C_EMIT_EDGE, emit_strength=0.15,
        ),
        "grass": mat("DT_Ground", C_GRASS, rough=0.95),
        "road": mat(
            "DT_Road", C_ROAD, rough=0.85, metallic=0.05,
            emission=C_EMIT_EDGE, emit_strength=0.25,
        ),
        "path": mat(
            "DT_Path", C_PATH, rough=0.80, metallic=0.08,
            emission=C_EMIT_EDGE, emit_strength=0.18,
        ),
        "trunk": mat("DT_Trunk", C_TRUNK, rough=0.92),
        "leaf": mat("DT_Leaf", C_LEAF, rough=0.95),
        "leaf2": mat("DT_Leaf2", C_LEAF2, rough=0.95),
        "fence": mat(
            "DT_Fence", C_FENCE, rough=0.65, metallic=0.25,
            emission=C_EMIT_EDGE, emit_strength=0.55,
        ),
    }


# ------------------------------------------------------------
# 几何助手
# ------------------------------------------------------------
def add_box(name, size, loc, material=None):
    """box：原点在底面中心，scale 已应用。"""
    w, d, h = size
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0))
    o = bpy.context.object
    o.name = name
    o.scale = (w, d, h)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.transform(Matrix.Translation((0, 0, h / 2.0)))
    o.location = loc
    if material is not None:
        o.data.materials.append(material)
    return o


def add_cylinder(name, radius, height, loc, material=None, vertices=6):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=height, location=loc)
    o = bpy.context.object
    o.name = name
    if material is not None:
        o.data.materials.append(material)
    return o


def add_ico(name, radius, loc, material=None, subdiv=1):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subdiv, radius=radius, location=loc)
    o = bpy.context.object
    o.name = name
    if material is not None:
        o.data.materials.append(material)
    return o


def add_windows(prefix, cx, cz, w, h, floors, cols, front_y, glass):
    """在 +Y 立面上循环生成窗洞（薄玻璃片）。"""
    objs = []
    floor_h = h / floors
    win_w = (w / cols) * 0.52
    win_h = floor_h * 0.5
    for f in range(floors):
        z = cz + floor_h * (f + 0.5)
        for c in range(cols):
            x = cx - w / 2.0 + (w / cols) * (c + 0.5)
            objs.append(add_box(f"{prefix}_w{f}_{c}", (win_w, 0.25, win_h), (x, front_y, z), glass))
    return objs


def add_cross(prefix, cx, cy, z, arm, thick, color_mat):
    v = add_box(f"{prefix}_v", (thick, 0.3, arm), (cx, cy, z), color_mat)
    h = add_box(f"{prefix}_h", (arm, 0.3, thick), (cx, cy, z + arm / 2.0 - thick / 2.0), color_mat)
    return [v, h]


def add_tree(name, loc, m, h=6.0):
    """低模树：树干 + 双层树冠（偏大、绿色）。"""
    trunk = add_cylinder(name + "_trunk", 0.26, h * 0.45, (loc[0], loc[1], h * 0.22), m["trunk"])
    f1 = add_ico(name + "_f1", h * 0.40, (loc[0], loc[1], h * 0.52), m["leaf"])
    f2 = add_ico(name + "_f2", h * 0.30, (loc[0], loc[1], h * 0.68), m["leaf2"])
    return [trunk, f1, f2]


def add_fence(name, hw, hd, m, gate_w=12.0):
    """院区四周护栏：立柱 + 上下两根横栏，正面(+Y)留大门缺口。"""
    objs = []
    post_h = 2.4
    rails = (0.9, 1.7)
    step = 7.0
    x = -hw
    while x <= hw + 0.001:
        for y in (-hd, hd):
            if y > 0 and abs(x) < gate_w / 2.0:
                continue  # 正面大门缺口
            objs.append(add_box(f"{name}_p", (0.2, 0.2, post_h), (x, y, 0), m["fence"]))
        x += step
    y = -hd
    while y <= hd + 0.001:
        for x in (-hw, hw):
            objs.append(add_box(f"{name}_p", (0.2, 0.2, post_h), (x, y, 0), m["fence"]))
        y += step
    for rz in rails:
        objs.append(add_box(f"{name}_rb", (2 * hw, 0.08, 0.08), (0, -hd, rz), m["fence"]))
        objs.append(add_box(f"{name}_rl", (0.08, 2 * hd, 0.08), (-hw, 0, rz), m["fence"]))
        objs.append(add_box(f"{name}_rr", (0.08, 2 * hd, 0.08), (hw, 0, rz), m["fence"]))
        seg = (2 * hw - gate_w) / 2.0
        if seg > 0.001:
            objs.append(add_box(f"{name}_rfl", (seg, 0.08, 0.08), (-(gate_w / 2 + seg / 2), hd, rz), m["fence"]))
            objs.append(add_box(f"{name}_rfr", (seg, 0.08, 0.08), (gate_w / 2 + seg / 2, hd, rz), m["fence"]))
    return objs


def add_building(name, cx, cy, w, d, floors, m, cols=None, wall="wall", accent=None):
    """一栋带窗格的楼：返回该楼所有对象。"""
    h = floors * 3.4
    objs = [add_box(name + "_body", (w, d, h), (cx, cy, 0), m[wall])]
    c = cols if cols else max(3, int(w / 4))
    objs += add_windows(name, cx, 0, w, h, floors, c, cy + d / 2.0 + 0.15, m["glass"])
    if accent:
        objs.append(add_box(name + "_sign", (w * 0.4, 0.25, 1.5), (cx, cy + d / 2.0 + 0.2, h + 0.4), m[accent]))
    return objs


def _is_decor(obj):
    n = obj.name.lower()
    return any(k in n for k in ("tree", "trunk", "_f1", "_f2", "fence", "grass", "road", "park", "path"))


def finalize(objects, name):
    if bpy.context.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')
    decor = [o for o in objects if _is_decor(o)]
    core = [o for o in objects if o not in decor]
    if not core:
        core = list(objects)
        decor = []

    bpy.ops.object.select_all(action='DESELECT')
    for o in core:
        o.select_set(True)
    bpy.context.view_layer.objects.active = core[0]
    if len(core) > 1:
        bpy.ops.object.join()
    joined = bpy.context.active_object
    joined.name = name
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    joined.location = (0, 0, 0)

    if JOIN_DECOR and decor:
        for d in decor:
            d.parent = joined
    return joined


def ensure_collection(name):
    col = bpy.data.collections.get(name)
    if col is None:
        col = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(col)
    return col


def link_to_collection(obj, col):
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    col.objects.link(obj)


def tri_count(obj):
    return sum(len(p.vertices) - 2 for p in obj.data.polygons)


# ------------------------------------------------------------
# 院区：TIER0 县级人民医院（门诊 + 住院塔 + 急诊 + 医技 + 行政 + 感染）
# ------------------------------------------------------------
def build_tier0(m):
    objs = []
    # 草皮
    if ADD_GROUND:
        objs.append(add_box("t0_grass", (95, 80, 0.3), (0, 0, -0.3), m["grass"]))
        # 主路（十字）+ 环道
        objs.append(add_box("t0_road_h", (95, 6, 0.32), (0, 6, -0.32), m["road"]))
        objs.append(add_box("t0_road_v", (6, 80, 0.32), (0, 0, -0.32), m["road"]))
        objs.append(add_box("t0_park", (26, 14, 0.32), (28, 22, -0.32), m["path"]))

    # 门诊楼（前，4 层）
    objs += add_building("t0_opd", 0, -16, 40, 20, 4, m, cols=10)
    # 住院塔（后，12 层）
    objs += add_building("t0_inpt", 0, -40, 22, 16, 12, m, cols=6, wall="wall2", accent="accent")
    objs.append(add_box("t0_hvac", (8, 5, 3), (0, -40, 12 * 3.4), m["roof"]))
    # 急诊楼（左前，2 层 + 雨棚）
    objs += add_building("t0_er", -32, -6, 20, 14, 2, m, cols=5)
    objs.append(add_box("t0_er_glass", (18, 0.3, 3.4), (-32, 1.15, 0.5), m["glass"]))
    objs.append(add_box("t0_canopy", (14, 6, 0.4), (-32, 4, 5.8), m["accent"]))
    # 医技楼（右前，3 层）
    objs += add_building("t0_diag", 30, -4, 22, 14, 3, m, cols=6)
    # 行政楼（右后，3 层）
    objs += add_building("t0_admin", 30, -32, 16, 12, 3, m, cols=4, wall="wall2")
    # 感染楼（左后，2 层，隔离）
    objs += add_building("t0_inf", -32, -34, 14, 10, 2, m, cols=3, accent="accent")
    # 入口标识（红十字门牌）
    objs += add_cross("t0_gate", 0, 16, 3.2, 2.2, 0.4, m["emblem"])
    objs.append(add_box("t0_gate_sign", (6, 0.4, 2.4), (0, 16, 0), m["wall2"]))

    # 树木：主路两侧 + 院区边角
    if ADD_TREES:
        tree_pos = [
            (-12, 22), (12, 22), (-20, 22), (20, 22),
            (-24, -8), (-24, -20), (24, -8), (24, -20),
            (-44, 0), (-44, -14), (44, 0), (44, -14),
            (-8, -48), (8, -48), (-44, -44), (44, -44),
            (0, 30), (-30, 30),
        ]
        for i, (tx, ty) in enumerate(tree_pos):
            objs += add_tree(f"t0_tree{i}", (tx, ty), m, h=7.0 + (i % 3))
    if ADD_FENCE:
        objs += add_fence("t0_fence", 46, 46, m, gate_w=14)
    return objs


# ------------------------------------------------------------
# 院区：TIER1 乡镇卫生院（门急诊综合楼 + 附楼 + 绿树）
# ------------------------------------------------------------
def build_tier1(m):
    objs = []
    if ADD_GROUND:
        objs.append(add_box("t1_grass", (56, 42, 0.3), (0, 0, -0.3), m["grass"]))
        objs.append(add_box("t1_road", (6, 42, 0.32), (0, 6, -0.32), m["road"]))
        objs.append(add_box("t1_park", (18, 10, 0.32), (16, 12, -0.32), m["path"]))

    # 门急诊综合楼（4 层）
    objs += add_building("t1_main", 0, -8, 34, 16, 4, m, cols=8)
    objs.append(add_box("t1_glass", (16, 0.3, 3.4), (0, 0.15, 0.5), m["glass"]))
    objs.append(add_box("t1_canopy", (10, 5, 0.4), (0, 2.5, 3.6), m["green"]))
    # 附楼（行政/公卫，2 层）
    objs += add_building("t1_annex", 20, -16, 14, 10, 2, m, cols=3, wall="wall2", accent="green")
    # 入口红十字
    objs += add_cross("t1_cross", 0, 10, 3.0, 2.0, 0.35, m["emblem"])

    if ADD_TREES:
        tree_pos = [(-14, 14), (-22, 6), (26, 6), (-24, -16), (6, 14), (-6, -24), (24, -24)]
        for i, (tx, ty) in enumerate(tree_pos):
            objs += add_tree(f"t1_tree{i}", (tx, ty), m, h=6.0 + (i % 2))
    if ADD_FENCE:
        objs += add_fence("t1_fence", 28, 22, m, gate_w=10)
    return objs


# ------------------------------------------------------------
# 院区：TIER2 村卫生室（小院 + 树 + 红十字）
# ------------------------------------------------------------
def build_tier2(m):
    objs = []
    if ADD_GROUND:
        objs.append(add_box("v_grass", (20, 16, 0.3), (0, 0, -0.3), m["grass"]))
        objs.append(add_box("v_path", (2.5, 12, 0.32), (0, 2, -0.32), m["path"]))

    # 主体（2 层）
    objs.append(add_box("v_main", (12, 8, 6), (0, 0, 0), m["wall"]))
    objs.append(add_box("v_roof", (13, 9, 0.5), (0, 0, 6), m["roof"]))
    # 正面红十字 + 绿色标识牌
    objs += add_cross("v_cross", 0, 4.15, 3.2, 2.4, 0.5, m["emblem"])
    objs.append(add_box("v_sign", (4, 0.2, 1.2), (0, 4.15, 6.6), m["muted"]))
    # 门 + 窗
    objs.append(add_box("v_door", (1.4, 0.2, 2.2), (0, 4.1, 1.1), m["glassD"]))
    objs.append(add_box("v_win1", (1.6, 0.25, 1.4), (-3, 4.1, 3), m["glass"]))
    objs.append(add_box("v_win2", (1.6, 0.25, 1.4), (3, 4.1, 3), m["glass"]))

    if ADD_TREES:
        objs += add_tree("v_tree1", (-7, -3), m, h=6.0)
        objs += add_tree("v_tree2", (7, -3), m, h=5.5)
    if ADD_FENCE:
        objs += add_fence("v_fence", 10, 8, m, gate_w=4)
    return objs


# ------------------------------------------------------------
# 院区：FLAGSHIP 协作上级（双塔 + 门诊 + 急诊 + 医技 + 行政 + 中央绿化）
# ------------------------------------------------------------
def build_flagship(m):
    objs = []
    if ADD_GROUND:
        objs.append(add_box("fl_grass", (110, 90, 0.3), (0, 0, -0.3), m["grass"]))
        objs.append(add_box("fl_road_h", (110, 6, 0.32), (0, 6, -0.32), m["road"]))
        objs.append(add_box("fl_road_v", (6, 90, 0.32), (0, 0, -0.32), m["road"]))
        objs.append(add_box("fl_plaza", (30, 20, 0.32), (0, 16, -0.32), m["path"]))

    # 门诊楼（前，4 层）
    objs += add_building("fl_opd", 0, -18, 46, 22, 4, m, cols=11)
    # 双住院塔（后，各 14 层）
    objs += add_building("fl_tower1", -18, -40, 20, 16, 14, m, cols=5, wall="wall2", accent="flagship")
    objs += add_building("fl_tower2", 18, -40, 20, 16, 14, m, cols=5, wall="wall2", accent="flagship")
    # 顶部红十字（双塔之间连廊顶部）
    objs += add_cross("fl_cross", 0, -40, 14 * 3.4 + 2, 5, 0.6, m["flagship"])
    # 急诊（左前）
    objs += add_building("fl_er", -38, -6, 20, 14, 2, m, cols=5)
    objs.append(add_box("fl_canopy", (14, 6, 0.4), (-38, 4, 5.8), m["flagship"]))
    # 医技（右前）
    objs += add_building("fl_diag", 36, -4, 22, 14, 3, m, cols=6)
    # 行政（右后）
    objs += add_building("fl_admin", 36, -34, 16, 12, 3, m, cols=4, wall="wall2")
    # 入口门牌
    objs.append(add_box("fl_gate", (8, 0.4, 2.6), (0, 18, 0), m["wall2"]))
    objs += add_cross("fl_gate_cross", 0, 18, 3.4, 2.0, 0.4, m["emblem"])

    if ADD_TREES:
        tree_pos = [
            (-14, 24), (14, 24), (-26, 24), (26, 24),
            (-28, -8), (-28, -20), (28, -8), (28, -20),
            (-50, 0), (-50, -14), (50, 0), (50, -14),
            (-10, -52), (10, -52), (-50, -48), (50, -48),
            (0, 34), (-34, 34), (34, 34),
        ]
        for i, (tx, ty) in enumerate(tree_pos):
            objs += add_tree(f"fl_tree{i}", (tx, ty), m, h=7.0 + (i % 3))
    if ADD_FENCE:
        objs += add_fence("fl_fence", 54, 46, m, gate_w=16)
    return objs


# ------------------------------------------------------------
# 导出
# ------------------------------------------------------------
def export_glb(obj, filename, export_dir):
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    path = os.path.join(export_dir, filename)
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format='GLB',
        use_selection=True,
        export_yup=True,
        export_apply=True,
    )
    print(f"[导出] {filename}  →  三角面 {tri_count(obj)}  →  {path}")


def main():
    if bpy.context.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')

    mats = make_materials()
    col = ensure_collection(COLLECTION_NAME)

    try:
        export_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "exports")
    except NameError:
        export_dir = bpy.path.abspath("//exports")
    os.makedirs(export_dir, exist_ok=True)

    builders = {
        "TIER0":    ("hospital-tier0-county.glb",     build_tier0),
        "TIER1":    ("hospital-tier1-township.glb",   build_tier1),
        "TIER2":    ("hospital-tier2-village.glb",    build_tier2),
        "FLAGSHIP": ("hospital-partner-flagship.glb", build_flagship),
    }

    for key, (fname, builder) in builders.items():
        if EXPORT_ONLY and key != EXPORT_ONLY:
            continue
        objs = builder(mats)
        joined = finalize(objs, f"HOSPITAL_{key}")
        link_to_collection(joined, col)
        export_glb(joined, fname, export_dir)

    print(f"\n完成。集合「{COLLECTION_NAME}」与 GLB 已就绪，导出目录：{export_dir}")


if __name__ == "__main__":
    main()
