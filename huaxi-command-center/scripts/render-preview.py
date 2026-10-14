# -*- coding: utf-8 -*-
"""把 exports/ 下 4 个医院院区 GLB 导入，打光渲染一张预览图。"""
import bpy
import os
import math

EXPORT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "exports")
OUT = os.path.join(EXPORT_DIR, "preview.png")

# 清空默认场景
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# 依次导入并横向排开
items = [
    ("hospital-tier0-county.glb", -72),
    ("hospital-tier1-township.glb", -26),
    ("hospital-tier2-village.glb", 6),
    ("hospital-partner-flagship.glb", 58),
]
for fname, xoff in items:
    bpy.ops.import_scene.gltf(filepath=os.path.join(EXPORT_DIR, fname))
    for obj in bpy.context.selected_objects:
        obj.location.x += xoff

# 天空背景（浅蓝）
world = bpy.data.worlds.new("Sky")
bpy.context.scene.world = world
world.use_nodes = True
nt = world.node_tree
nt.nodes.clear()
bg = nt.nodes.new("ShaderNodeBackground")
bg.inputs[0].default_value = (0.72, 0.83, 0.95, 1.0)
out = nt.nodes.new("ShaderNodeOutputWorld")
nt.links.new(bg.outputs[0], out.inputs[0])

# 太阳光
bpy.ops.object.light_add(type='SUN', location=(40, -60, 80))
sun = bpy.context.object
sun.data.energy = 4.0
sun.rotation_euler = (math.radians(45), math.radians(20), math.radians(40))

# 相机（3/4 俯视，看向原点）
bpy.ops.object.camera_add(location=(0, -150, 70))
cam = bpy.context.object
lookat = bpy.data.objects.new("LookAt", None)
bpy.context.scene.collection.objects.link(lookat)
lookat.location = (0, 0, 12)
cam.constraints.new('TRACK_TO')
cam.constraints[0].target = lookat
cam.constraints[0].track_axis = 'TRACK_NEGATIVE_Z'
cam.constraints[0].up_axis = 'UP_Y'
bpy.context.scene.camera = cam

# 渲染
sc = bpy.context.scene
sc.render.engine = 'BLENDER_EEVEE'
sc.render.resolution_x = 2560
sc.render.resolution_y = 960
sc.render.filepath = OUT
bpy.ops.render.render(write_still=True)
print("预览图已输出:", OUT)
