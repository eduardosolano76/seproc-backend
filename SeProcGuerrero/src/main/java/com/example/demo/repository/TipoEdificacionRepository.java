package com.example.demo.repository;

import com.example.demo.modelo.TipoEdificacion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TipoEdificacionRepository extends JpaRepository<TipoEdificacion, Integer> {

	List<TipoEdificacion> findByActivoTrueOrderByNombreAsc();

}