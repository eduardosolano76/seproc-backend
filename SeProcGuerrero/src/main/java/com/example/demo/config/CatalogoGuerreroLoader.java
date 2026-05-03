package com.example.demo.config;

import com.example.demo.modelo.CatEstado;
import com.example.demo.modelo.CatLocalidad;
import com.example.demo.modelo.CatMunicipio;
import com.example.demo.repository.CatEstadoRepository;
import com.example.demo.repository.CatLocalidadRepository;
import com.example.demo.repository.CatMunicipioRepository;
import com.example.demo.service.InegiCatalogoService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CatalogoGuerreroLoader {

	@Bean
	CommandLineRunner cargarCatalogosGuerrero(CatEstadoRepository estadoRepository,
			CatMunicipioRepository municipioRepository, CatLocalidadRepository localidadRepository,
			InegiCatalogoService inegiCatalogoService) {
		return args -> {

			CatEstado guerrero = estadoRepository.findByCveEstado("12").orElseGet(() -> {
				CatEstado estado = new CatEstado();
				estado.setCveEstado("12");
				estado.setNombre("Guerrero");
				return estadoRepository.save(estado);
			});

			if (municipioRepository.count() > 0 || localidadRepository.count() > 0) {
				System.out.println("Los catálogos ya tienen datos. No se ejecuta la carga.");
				return;
			}

			var municipiosInegi = inegiCatalogoService.obtenerMunicipiosDeGuerrero();

			for (var m : municipiosInegi) {

				CatMunicipio municipio = municipioRepository.findByEstadoAndCveMunicipio(guerrero, m.getCve_mun())
					.orElseGet(() -> {
						CatMunicipio nuevo = new CatMunicipio();
						nuevo.setEstado(guerrero);
						nuevo.setCveMunicipio(m.getCve_mun());
						nuevo.setNombre(m.getNomgeo());
						return municipioRepository.save(nuevo);
					});

				var localidadesInegi = inegiCatalogoService.obtenerLocalidadesDeMunicipio(m.getCve_mun());

				for (var l : localidadesInegi) {
					boolean existe = localidadRepository.existsByMunicipioAndCveLocalidad(municipio, l.getCve_loc());

					if (!existe) {
						CatLocalidad localidad = new CatLocalidad();
						localidad.setEstado(guerrero);
						localidad.setMunicipio(municipio);
						localidad.setCveLocalidad(l.getCve_loc());
						localidad.setNombre(l.getNomgeo());
						localidadRepository.save(localidad);
					}
				}

				System.out.println("Municipio cargado: " + municipio.getNombre());
			}

			System.out.println("Carga de municipios y localidades de Guerrero terminada.");
		};
	}

}