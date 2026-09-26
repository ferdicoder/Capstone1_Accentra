import { useEffect, useRef } from "react"

import modelUrl from "@/assets/3dLogo.gltf?url"

const clamp = (value) => Math.min(1, Math.max(0, value))

/**
 * Renders the supplied Accentra GLTF as a restrained section accent.
 *
 * The model is loaded only when this component mounts, rendered on demand
 * rather than in a permanent animation loop, and stays front-facing while its
 * horizontal offset and front-facing rotation are driven by page scroll
 * progress through the section. It is decorative and never receives pointer
 * or focus events.
 */
export function Landing3DLogo({ className = "" }) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return undefined

    // The entrance offset is measured against the stable section slot rather
    // than the moving element, so progress stays accurate while the model is
    // still outside the viewport.
    const track = container.parentElement || container

    let cancelled = false
    let renderer
    let scene
    let camera
    let model
    let environmentTexture
    let resizeObserver
    let intersectionObserver
    let scrollFrame = 0
    let isVisible = true
    let baseScale = 1

    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    )

    const renderScene = () => {
      if (!renderer || !scene || !camera) return
      renderer.render(scene, camera)
    }

    const getSectionProgress = () => {
      const rect = track.getBoundingClientRect()
      const viewportHeight = window.innerHeight || 1
      const start = viewportHeight * 0.92
      const end = viewportHeight * 0.24
      const travel = Math.max(rect.height * 0.9 + start - end, 1)
      return clamp((start - rect.top) / travel)
    }

    const setEntrancePosition = (progress) => {
      const parentWidth = track.clientWidth || 0
      const modelWidth = container.offsetWidth || 1
      const finalX = Math.max((parentWidth - modelWidth) / 2, 0)
      const startX = -modelWidth - 48
      const easedProgress = progress * progress * (3 - 2 * progress)
      const offset = motionPreference.matches
        ? finalX
        : startX + (finalX - startX) * easedProgress

      container.style.setProperty("--landing-3d-x", `${offset}px`)
    }

    const applyScrollProgress = () => {
      const sectionProgress = getSectionProgress()
      container.dataset.scrollProgress = sectionProgress.toFixed(3)
      setEntrancePosition(sectionProgress)

      if (!model || !isVisible) return

      // Turn the logo toward the viewer as it reaches its resting position.
      const entranceTurn = motionPreference.matches
        ? 0
        : -Math.PI * 0.42 * (1 - sectionProgress)
      model.rotation.set(0, entranceTurn, 0)
      model.position.set(0, 0, 0)
      model.scale.setScalar(baseScale)

      renderScene()
    }

    const scheduleRender = () => {
      if (scrollFrame) return
      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = 0
        applyScrollProgress()
      })
    }

    const handleMotionChange = () => {
      if (motionPreference.matches) {
        applyScrollProgress()
      } else {
        scheduleRender()
      }
    }

    const initialize = async () => {
      try {
        const [THREE, { GLTFLoader }, { RoomEnvironment }] = await Promise.all([
          import("three"),
          import("three/examples/jsm/loaders/GLTFLoader.js"),
          import("three/examples/jsm/environments/RoomEnvironment.js"),
        ])

        if (cancelled) return

        scene = new THREE.Scene()
        camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
        camera.position.set(0, 0, 4.2)

        renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: true,
          powerPreference: "low-power",
        })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 1

        const pmremGenerator = new THREE.PMREMGenerator(renderer)
        const roomEnvironment = new RoomEnvironment()
        environmentTexture = pmremGenerator.fromScene(roomEnvironment).texture
        scene.environment = environmentTexture
        roomEnvironment.dispose()
        pmremGenerator.dispose()

        const hemisphereLight = new THREE.HemisphereLight(
          0xbfeee2,
          0x011a16,
          0.45,
        )
        const keyLight = new THREE.DirectionalLight(0xffffff, 2)
        keyLight.position.set(2.5, 3.5, 4)
        const emeraldLight = new THREE.PointLight(0x0b6b4a, 1.2, 8)
        emeraldLight.position.set(-2.4, -1.5, 2.5)
        const rimLight = new THREE.PointLight(0xd8fff1, 2.4, 7)
        rimLight.position.set(2, 1.5, -2)
        const glintLight = new THREE.PointLight(0xffffff, 18, 4.5)
        glintLight.position.set(1.1, 1.6, 2)
        const glintFill = new THREE.PointLight(0xbfffe6, 9, 4)
        glintFill.position.set(-1.6, 0.9, 1.6)

        scene.add(
          hemisphereLight,
          keyLight,
          emeraldLight,
          rimLight,
          glintLight,
          glintFill,
        )

        const resize = () => {
          if (!renderer || !camera) return
          const width = Math.max(container.clientWidth, 1)
          const height = Math.max(container.clientHeight, 1)
          renderer.setSize(width, height, false)
          camera.aspect = width / height
          camera.updateProjectionMatrix()
          scheduleRender()
        }

        resizeObserver = new ResizeObserver(resize)
        resizeObserver.observe(container)
        resize()

        const loader = new GLTFLoader()
        loader.load(
          modelUrl,
          (gltf) => {
            if (cancelled || !renderer) {
              gltf.scene.traverse((child) => {
                if (!child.isMesh) return
                child.geometry.dispose()
                if (Array.isArray(child.material)) {
                  child.material.forEach((material) => material.dispose())
                } else {
                  child.material?.dispose()
                }
              })
              return
            }

            const modelRoot = gltf.scene
            const modelGroup = new THREE.Group()
            modelGroup.add(modelRoot)
            modelRoot.traverse((child) => {
              if (!child.isMesh) return
              child.castShadow = false
              child.receiveShadow = false
              if (child.material) {
                const material = child.material
                // Stronger environment reflections give the polished crystal
                // facets their highlights.
                material.envMapIntensity = 2.2
                material.needsUpdate = true
                // Tint the clear asset toward a dark green crystal without
                // changing the source GLTF.
                if ("color" in material) {
                  material.color.set("#0d4a34")
                }
                if ("transmission" in material) {
                  // Partial transmission: thin edges stay translucent while the
                  // body keeps the deep, saturated gemstone green.
                  material.transmission = 0.42
                }
                if ("thickness" in material) {
                  material.thickness = 2.2
                }
                if ("attenuationDistance" in material) {
                  // Short distance so light is absorbed quickly and thick
                  // sections fall away to near-black green.
                  material.attenuationDistance = 0.5
                }
                if ("attenuationColor" in material) {
                  material.attenuationColor.set("#04281a")
                }
                if ("ior" in material) {
                  // Above glass, closer to a cut gemstone.
                  material.ior = 1.9
                }
                if ("dispersion" in material) {
                  // Subtle prismatic fringing on the refracted edges.
                  material.dispersion = 0.6
                }
                if ("iridescence" in material) {
                  material.iridescence = 0.15
                  material.iridescenceIOR = 1.6
                }
                if ("clearcoat" in material) {
                  material.clearcoat = 1
                }
                if ("clearcoatRoughness" in material) {
                  material.clearcoatRoughness = 0.015
                }
                if ("specularIntensity" in material) {
                  material.specularIntensity = 1
                }
                if ("specularColor" in material) {
                  material.specularColor.set("#f2fffb")
                }
                if ("roughness" in material) {
                  // Near-mirror surface for the wet, glassy shine.
                  material.roughness = 0.02
                }
                if ("metalness" in material) {
                  material.metalness = 0
                }
              }
            })

            modelRoot.updateMatrixWorld(true)
            const bounds = new THREE.Box3().setFromObject(modelRoot)
            const center = bounds.getCenter(new THREE.Vector3())
            const size = bounds.getSize(new THREE.Vector3())
            const maxDimension = Math.max(size.x, size.y, size.z, 0.001)

            modelRoot.position.x -= center.x
            modelRoot.position.y -= center.y
            modelRoot.position.z -= center.z
            baseScale = 1.8 / maxDimension
            modelRoot.scale.setScalar(1)

            model = modelGroup
            model.rotation.set(0, 0, 0)
            model.position.set(0, 0, 0)
            scene.add(model)
            applyScrollProgress()
            resize()
          },
          undefined,
          () => {
            // A decorative model should never block the rest of the landing page.
          },
        )

        intersectionObserver = new IntersectionObserver(
          ([entry]) => {
            isVisible = entry.isIntersecting
            if (isVisible) scheduleRender()
          },
          { rootMargin: "160px" },
        )
        intersectionObserver.observe(track)
      } catch {
        // WebGL or the optional model runtime is unavailable; the page remains usable.
      }
    }

    const handleScroll = () => {
      if (isVisible) scheduleRender()
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", scheduleRender)
    motionPreference.addEventListener?.("change", handleMotionChange)
    initialize()

    return () => {
      cancelled = true
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", scheduleRender)
      motionPreference.removeEventListener?.("change", handleMotionChange)
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame)
      resizeObserver?.disconnect()
      intersectionObserver?.disconnect()
      model?.traverse((child) => {
        if (!child.isMesh) return
        child.geometry.dispose()
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => material.dispose())
        } else {
          child.material?.dispose()
        }
      })
      environmentTexture?.dispose()
      renderer?.dispose()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`landing-3d-logo pointer-events-none absolute overflow-hidden ${className}`}
    >
      <canvas ref={canvasRef} className="block size-full" />
    </div>
  )
}
