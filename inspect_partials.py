import json, glob, os

partials = ['alkira-s-vigor','haste','fear','slow','blight','force-armor','grasping-vines','grease',
            'fly','heroism','invisibility','shadow-sphere','silence','web','earthquake',
            'binding-paralysis','beguiling-weave','suggestion','hailstorm','counterweave',
            'confusion','calm-emotions','barkward','enschede-s-hand','false-visage','fortune-s-favor',
            'grease','hirnaloyta-s-step','light','mental-domination','mesmerizing-pattern',
            'nevil-s-clarity','perfect-invisibility','phantom-decoy','revealing-light',
            'rudlu-s-fortune','shu-jahan-s-sight','sleep','spectral-grasp','suggestion-mass',
            'telekinesis','telekinetic-shove','uncontrollable-laughter']

for name in partials:
    path = f'foundryvtt/packs/weaves/_source/{name}.json'
    if not os.path.exists(path):
        print(f'MISSING: {name}')
        continue
    with open(path) as f:
        d = json.load(f)
    s = d.get('system', {})
    effects = d.get('effects', [])
    efx_names = [e.get('name') for e in effects]
    changes = [c for e in effects for c in e.get('changes',[])]
    print(f'{name}')
    print(f'  savingThrow={s.get("savingThrow")} appliesEffects={s.get("appliesEffects")} effectType={s.get("effectType")}')
    print(f'  duration={s.get("duration")} damagBase={s.get("damage",{}).get("base") if isinstance(s.get("damage"),dict) else s.get("damage")}')
    print(f'  active_effects={efx_names}  changes={changes}')
    print()
