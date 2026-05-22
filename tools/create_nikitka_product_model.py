import math
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(r"M:\AI\3D\05_OUTPUTS\2026-05-22_17-31-50_nikitka_ai_pro_headphones_site_model")
PROJECT = Path(r"M:\Projects\sites\Naushniki Nikitkaai")
EXPORTS = ROOT / "exports"
PREVIEWS = ROOT / "previews"
EXPORTS.mkdir(parents=True, exist_ok=True)
PREVIEWS.mkdir(parents=True, exist_ok=True)


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.context.scene.render.engine = "CYCLES"
    bpy.context.scene.cycles.samples = 96
    bpy.context.scene.view_settings.view_transform = "Filmic"
    bpy.context.scene.view_settings.look = "Medium High Contrast"
    bpy.context.scene.view_settings.exposure = 0
    bpy.context.scene.view_settings.gamma = 1


def material(name, base, *, metallic=0.0, roughness=0.25, alpha=1.0, emission=None, strength=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = base
        bsdf.inputs["Metallic"].default_value = metallic
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Alpha"].default_value = alpha
        if emission:
            bsdf.inputs["Emission Color"].default_value = emission
            bsdf.inputs["Emission Strength"].default_value = strength
    mat.diffuse_color = base
    if alpha < 1:
        mat.blend_method = "BLEND"
        mat.use_screen_refraction = True
        mat.show_transparent_back = True
    return mat


def assign(obj, mat):
    obj.data.materials.append(mat)
    return obj


def shade(obj):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    try:
        bpy.ops.object.shade_smooth()
    except Exception:
        pass
    obj.select_set(False)
    return obj


def bevel(obj, amount=0.08, segments=8):
    mod = obj.modifiers.new("soft bevel", "BEVEL")
    mod.width = amount
    mod.segments = segments
    mod.affect = "EDGES"
    obj.modifiers.new("weighted highlights", "WEIGHTED_NORMAL")
    return obj


def cube(name, location, scale, mat, bevel_width=0.08, bevel_segments=8):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    assign(obj, mat)
    bevel(obj, bevel_width, bevel_segments)
    return obj


def uv_sphere(name, location, scale, mat, segments=64, rings=32, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, radius=1, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    assign(obj, mat)
    shade(obj)
    obj.modifiers.new("weighted highlights", "WEIGHTED_NORMAL")
    return obj


def cyl(name, location, radius, depth, mat, vertices=64, rotation=(0, 0, 0), scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    assign(obj, mat)
    shade(obj)
    bevel(obj, radius * 0.12, 6)
    return obj


def torus(name, location, major, minor, mat, rotation=(0, 0, 0), scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_torus_add(major_segments=96, minor_segments=16, major_radius=major, minor_radius=minor, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    assign(obj, mat)
    shade(obj)
    return obj


def add_text(name, text, location, rotation, size, mat, align="CENTER"):
    font_curve = bpy.data.curves.new(name, "FONT")
    font_curve.body = text
    font_curve.align_x = align
    font_curve.align_y = "CENTER"
    font_curve.size = size
    font_curve.extrude = 0.006
    obj = bpy.data.objects.new(name, font_curve)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = rotation
    assign(obj, mat)
    return obj


def capsule_between(name, start, end, radius, mat):
    start = Vector(start)
    end = Vector(end)
    midpoint = (start + end) / 2
    direction = end - start
    length = direction.length
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=radius, depth=length, location=midpoint)
    obj = bpy.context.object
    obj.name = name
    quat = direction.to_track_quat("Z", "Y")
    obj.rotation_euler = quat.to_euler()
    assign(obj, mat)
    shade(obj)
    bevel(obj, radius * 0.18, 10)
    uv_sphere(f"{name}_cap_a", start, (radius, radius, radius), mat, segments=32, rings=16)
    uv_sphere(f"{name}_cap_b", end, (radius, radius, radius), mat, segments=32, rings=16)
    return obj


def create_earbud(prefix, x, y, z, side=1, floating=False):
    body = uv_sphere(f"{prefix}_rounded_acoustic_body", (x, y, z), (0.44, 0.33, 0.5), glossy_black, rotation=(0.18, 0.0, side * 0.12))
    face = uv_sphere(f"{prefix}_transparent_sensor_shell", (x + side * 0.04, y - 0.05, z + 0.06), (0.36, 0.17, 0.38), smoked_glass, segments=64, rings=24, rotation=(0.1, 0, 0))
    tip = cyl(f"{prefix}_silicone_ear_tip", (x - side * 0.36, y - 0.22, z - 0.02), 0.18, 0.34, rubber, vertices=48, rotation=(math.pi / 2, side * 0.22, 0), scale=(1.0, 1.0, 0.72))
    torus(f"{prefix}_tip_soft_lip", (x - side * 0.5, y - 0.22, z - 0.02), 0.16, 0.035, rubber, rotation=(math.pi / 2, side * 0.22, 0), scale=(1.0, 0.74, 1.0))
    torus(f"{prefix}_driver_beryllium_ring", (x - side * 0.2, y - 0.27, z + 0.06), 0.2, 0.018, metal, rotation=(math.pi / 2, 0, 0), scale=(1.1, 0.78, 0.22))
    cyl(f"{prefix}_micro_driver_diaphragm", (x - side * 0.2, y - 0.294, z + 0.06), 0.16, 0.025, cyan_emit, vertices=64, rotation=(math.pi / 2, 0, 0), scale=(1.1, 0.78, 0.18))

    stem_top = (x + side * 0.2, y - 0.08, z - 0.26)
    stem_bottom = (x + side * 0.46, y - 0.12, z - 1.17)
    capsule_between(f"{prefix}_polished_stem", stem_top, stem_bottom, 0.13, glossy_black)
    capsule_between(f"{prefix}_stem_inner_light_pipe", (stem_top[0] + side * 0.035, stem_top[1] - 0.015, stem_top[2] - 0.17), (stem_bottom[0] + side * 0.02, stem_bottom[1] - 0.015, stem_bottom[2] + 0.2), 0.022, purple_emit)
    capsule_between(f"{prefix}_titanium_stem_edge", (stem_top[0] - side * 0.075, stem_top[1] - 0.004, stem_top[2] - 0.12), (stem_bottom[0] - side * 0.056, stem_bottom[1] - 0.006, stem_bottom[2] + 0.26), 0.018, metal)

    sensor = cyl(f"{prefix}_fingerprint_sensor_disc", (x + side * 0.12, y - 0.27, z + 0.18), 0.17, 0.035, purple_emit, vertices=64, rotation=(math.pi / 2, 0, 0), scale=(1.0, 1.0, 0.35))
    for i, r in enumerate((0.07, 0.11, 0.145)):
        ring = torus(f"{prefix}_fingerprint_ring_{i}", (x + side * 0.12, y - 0.292, z + 0.18), r, 0.006, purple_emit, rotation=(math.pi / 2, 0, 0), scale=(1, 1, 0.25))
        ring.scale.x = 0.8 + i * 0.08
    cyan = cyl(f"{prefix}_mic_port_cyan", (x + side * 0.4, y - 0.2, z - 0.84), 0.035, 0.014, cyan_emit, vertices=28, rotation=(math.pi / 2, 0, 0))

    for obj in (body, face, tip, sensor, cyan):
        obj["nikitka_part"] = prefix
    if floating:
        for obj in bpy.context.scene.objects:
            if obj.name.startswith(prefix):
                obj.rotation_euler[2] += side * 0.16
                obj.rotation_euler[0] += -0.08


def add_case_internals():
    battery = material("matte graphene battery cell", (0.08, 0.1, 0.12, 1), metallic=0.18, roughness=0.32)
    board = material("dark ai logic board", (0.01, 0.05, 0.065, 1), metallic=0.24, roughness=0.18)
    chip = material("black neural dsp package", (0.006, 0.007, 0.011, 1), metallic=0.48, roughness=0.16)

    for side in (-1, 1):
        cell = cube(f"case_battery_cell_{side}", (side * 1.18, 0.35, 0.64), (1.05, 0.58, 0.16), battery, 0.055, 8)
        cell.rotation_euler[2] = side * math.radians(3)
        add_text(f"case_battery_cell_label_{side}", "GRAPHENE", (side * 1.18, 0.03, 0.74), (math.radians(90), 0, 0), 0.072, white_emit)

    ai_board = cube("ai_core_board_teal_pcb", (0, 0.34, 0.72), (0.92, 0.58, 0.09), board, 0.045, 8)
    ai_board.rotation_euler[2] = math.radians(-2)
    main_chip = cube("ai_core_neural_dsp_chip", (0, 0.02, 0.86), (0.44, 0.09, 0.26), chip, 0.035, 6)
    main_chip.rotation_euler[2] = math.radians(-2)
    add_text("ai_core_chip_text", "N-CORE", (0, -0.035, 0.91), (math.radians(90), 0, 0), 0.064, cyan_emit)

    for i, x in enumerate([-0.37, -0.22, 0.22, 0.37]):
        cube(f"ai_core_memory_block_{i}", (x, 0.03, 0.72), (0.11, 0.07, 0.17), chip, 0.018, 4)
    for i, x in enumerate([-0.52, -0.36, -0.2, 0.2, 0.36, 0.52]):
        capsule_between(f"ai_core_cyan_trace_{i}", (x, 0.005, 0.79), (x * 0.36, 0.005, 0.86), 0.009, cyan_emit)

    hinge = cyl("case_precision_hinge_titanium", (0, 1.04, 1.12), 0.055, 4.65, metal, vertices=48, rotation=(0, math.pi / 2, 0), scale=(1, 1, 1))
    hinge.rotation_euler[0] = math.radians(-12)


def create_scene():
    reset_scene()

    global glossy_black, smoked_glass, rubber, metal, cyan_emit, purple_emit, white_emit, dark_panel
    glossy_black = material("obsidian black ceramic", (0.005, 0.006, 0.011, 1), metallic=0.55, roughness=0.14)
    smoked_glass = material("smoked transparent polycarbonate", (0.08, 0.15, 0.28, 0.34), metallic=0.05, roughness=0.08, alpha=0.36)
    rubber = material("soft graphite silicone", (0.015, 0.016, 0.025, 1), metallic=0.0, roughness=0.58)
    metal = material("polished dark titanium", (0.48, 0.52, 0.62, 1), metallic=0.88, roughness=0.16)
    dark_panel = material("deep OLED glass", (0.01, 0.012, 0.025, 1), metallic=0.25, roughness=0.08)
    cyan_emit = material("cyan active light", (0.0, 0.9, 1.0, 1), metallic=0.15, roughness=0.18, emission=(0.0, 0.95, 1.0, 1), strength=2.8)
    purple_emit = material("violet neural light", (0.45, 0.12, 1.0, 1), metallic=0.1, roughness=0.18, emission=(0.52, 0.18, 1.0, 1), strength=3.5)
    white_emit = material("soft white micro text", (0.8, 0.88, 1.0, 1), metallic=0, roughness=0.2, emission=(0.7, 0.82, 1.0, 1), strength=1.2)

    base = cube("case_base_rounded_translucent_black", (0, 0, 0.34), (5.25, 2.35, 0.86), glossy_black, 0.18, 14)
    case_top_glass = cube("case_top_smoked_clear_shell", (0, -0.04, 0.88), (5.0, 2.08, 0.18), smoked_glass, 0.18, 14)
    front_panel = cube("case_front_oled_panel", (0, -1.19, 0.4), (2.0, 0.08, 0.42), dark_panel, 0.07, 8)
    add_text("case_front_brand_text", "NIKITKA AI PRO", (0, -1.238, 0.46), (math.radians(90), 0, 0), 0.18, white_emit)
    add_text("case_front_battery_text", "100%", (-0.55, -1.242, 0.24), (math.radians(90), 0, 0), 0.105, purple_emit)
    capsule_between("case_front_cyan_light_blade", (-2.22, -1.255, 0.66), (2.22, -1.255, 0.66), 0.015, cyan_emit)
    capsule_between("case_rear_precision_light_seam", (-2.28, 1.03, 0.92), (2.28, 1.03, 0.92), 0.013, purple_emit)

    for i in range(10):
        cube(f"case_battery_bar_{i:02d}", (-0.18 + i * 0.075, -1.25, 0.24), (0.044, 0.018, 0.13), purple_emit, 0.01, 2)

    for side in (-1, 1):
        torus(f"case_well_neon_ring_{side}", (side * 1.45, -0.15, 1.0), 0.55, 0.035, purple_emit, rotation=(0, 0, 0), scale=(1.26, 0.82, 0.12))
        cyl(f"case_well_dark_cavity_{side}", (side * 1.45, -0.15, 0.95), 0.5, 0.08, dark_panel, vertices=96, scale=(1.26, 0.82, 0.12))
        cyl(f"case_charge_pin_{side}_a", (side * 1.22, -0.16, 1.04), 0.035, 0.035, cyan_emit, vertices=24)
        cyl(f"case_charge_pin_{side}_b", (side * 1.68, -0.16, 1.04), 0.035, 0.035, cyan_emit, vertices=24)

    add_case_internals()

    lid = cube("open_lid_transparent_oled_window", (0, 0.95, 2.02), (4.85, 0.22, 1.75), smoked_glass, 0.16, 14)
    lid.rotation_euler[0] = math.radians(-12)
    lid_panel = cube("lid_inner_adaptive_sound_display", (0, 0.78, 2.05), (2.55, 0.05, 0.82), dark_panel, 0.08, 8)
    lid_panel.rotation_euler[0] = math.radians(-12)
    add_text("lid_ui_title", "NIKITKA AI PRO", (0, 0.72, 2.24), (math.radians(78), 0, 0), 0.18, white_emit)
    add_text("lid_ui_adaptive", "ADAPTIVE SOUND  ON", (0, 0.71, 2.05), (math.radians(78), 0, 0), 0.095, cyan_emit)
    add_text("lid_ui_specs", "96 kHz / 24 bit", (0, 0.70, 1.87), (math.radians(78), 0, 0), 0.092, purple_emit)

    torus("hologram_wave_base", (0, -0.2, 1.18), 0.43, 0.018, cyan_emit, scale=(1.3, 1.3, 0.14))
    for i, h in enumerate([0.18, 0.32, 0.48, 0.64, 0.38, 0.26, 0.44, 0.28, 0.16]):
        x = -0.42 + i * 0.105
        capsule_between(f"hologram_wave_bar_{i:02d}", (x, -0.2, 1.25), (x, -0.2, 1.25 + h), 0.015, purple_emit)

    create_earbud("left_floating_earbud", -1.75, -0.14, 2.25, side=-1, floating=True)
    create_earbud("right_docked_earbud", 1.35, -0.18, 2.1, side=1, floating=False)

    # Accent arcs around the whole product.
    torus("product_floor_neon_orbit", (0, -0.08, -0.08), 2.35, 0.012, purple_emit, scale=(1.15, 0.5, 0.05))
    torus("product_rear_cyan_orbit", (0, 0.45, 1.5), 2.3, 0.008, cyan_emit, rotation=(math.radians(78), 0, 0), scale=(1.05, 0.52, 0.05))

    # Lighting and camera.
    bpy.ops.object.light_add(type="AREA", location=(-3.3, -4.2, 5.1))
    key = bpy.context.object
    key.name = "large_softbox_left"
    key.data.energy = 520
    key.data.size = 5.5

    bpy.ops.object.light_add(type="POINT", location=(3.1, -2.6, 2.7))
    rim = bpy.context.object
    rim.name = "violet_rim_light"
    rim.data.color = (0.45, 0.15, 1.0)
    rim.data.energy = 270

    bpy.ops.object.camera_add(location=(4.8, -6.0, 3.25), rotation=(math.radians(62), 0, math.radians(42)))
    camera = bpy.context.object
    bpy.context.scene.camera = camera
    camera.data.lens = 48
    camera.data.dof.use_dof = True
    camera.data.dof.focus_distance = 6.0
    camera.data.dof.aperture_fstop = 5.6

    bpy.context.scene.render.resolution_x = 1600
    bpy.context.scene.render.resolution_y = 1000

    glb = EXPORTS / "nikitka_ai_pro_product.glb"
    bpy.ops.export_scene.gltf(
        filepath=str(glb),
        export_format="GLB",
        export_yup=True,
        export_apply=True,
        export_materials="EXPORT",
    )

    preview = PREVIEWS / "nikitka_ai_pro_product_preview.png"
    bpy.context.scene.render.filepath = str(preview)
    bpy.ops.render.render(write_still=True)

    site_glb = PROJECT / "assets" / "nikitka-ai-pro-product.glb"
    site_glb.write_bytes(glb.read_bytes())
    return glb, preview, site_glb


if __name__ == "__main__":
    glb_path, preview_path, site_path = create_scene()
    print(f"GLB={glb_path}")
    print(f"PREVIEW={preview_path}")
    print(f"SITE_GLB={site_path}")
